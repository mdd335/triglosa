"""Makes the four files the word aligner reads (src-tauri/src/align.rs) out of
the published model, into the folder named:

    python scripts/aligner-pack.py <folder>
    python scripts/aligner-pack.py --table4 <folder>   # the last step alone

Wants torch, transformers 4.x (the model's own code does not load in 5),
onnx, onnxruntime and tokenizers; the last step alone wants numpy and onnx.
Nothing here is part of the app's build.

What is done to the model, each step measured before it was taken:

  - the five layers above the seventh are dropped: the links are read off
    the seventh, and not one of them changes;
  - the weights are rounded to 8 bits;
  - the word table, three quarters of them, is rounded further to 4 bits,
    each block of 32 numbers of a row around nothing with a scale of its
    own, two to a byte, read by ONNX Runtime's GatherBlockQuantized: 98 %
    of the links stay, 84 MB less (runs seventy-seven and seventy-eight);
  - they are written to a file of their own, model.data, which ONNX Runtime
    maps from the disk instead of copying into memory;
  - the tokenizer's quarter of a million pieces go to pieces.txt, one a line
    with its score, the line's number its id, and tokenizer.json keeps only
    how a text is tidied and split into words.

The files a build packs are the attachments of the release `aligner-2`
(scripts/aligner-fetch.mjs, which holds their checksums), beside a NOTICE.txt
naming the model they come from and its license. A new pack is a new
release and new checksums there.
"""

import json
import os
import sys
import tempfile

import numpy as np
import onnx
from onnx import TensorProto, helper, numpy_helper

MODEL = "WPS-Qingqiu/OmniAlign"
LAYERS = 7
TABLE = "model.embeddings.word_embeddings.weight"
GATHERED = "/model/embeddings/word_embeddings/Gather_output_0"
BLOCK = 32


def table_in_four_bits(out):
    """Rewrites the word table of the pack in `out` from 8 bits under one
    scale to 4 bits under a scale per block. ONNX Runtime 1.22 takes no zero
    for codes packed two to a byte, so a block is rounded around nothing:
    -8 … 7, stored as 0 … 15."""
    model = onnx.load(os.path.join(out, "model.onnx"))
    graph = model.graph
    inits = {t.name: t for t in graph.initializer}
    codes8 = numpy_helper.to_array(inits[TABLE + "_quantized"]).astype(np.float32)
    scale8 = float(numpy_helper.to_array(inits[TABLE + "_scale"]))
    zero8 = float(numpy_helper.to_array(inits[TABLE + "_zero_point"]))
    rows, width = codes8.shape
    grouped = ((codes8 - zero8) * scale8).reshape(rows, width // BLOCK, BLOCK)
    scale = (np.maximum(np.abs(grouped).max(axis=2), 1e-12) / 7).astype(np.float16)
    wide = scale.astype(np.float32)[..., None]
    codes = (np.clip(np.round(grouped / wide), -8, 7) + 8).astype(np.uint8).reshape(rows, width)
    packed = (codes[:, 0::2] | (codes[:, 1::2] << 4)).astype(np.uint8)

    for name in ["_quantized", "_scale", "_zero_point"]:
        graph.initializer.remove(inits[TABLE + name])
    old = [n for n in graph.node if GATHERED in n.output or GATHERED + "_quantized" in n.output]
    at = list(graph.node).index(old[0])
    for node in old:
        graph.node.remove(node)
    graph.initializer.extend([
        numpy_helper.from_array(packed, TABLE + "_4bit"),
        numpy_helper.from_array(scale, TABLE + "_4bit_scale"),
    ])
    graph.node.insert(at, helper.make_node(
        "GatherBlockQuantized", [TABLE + "_4bit", "input_ids", TABLE + "_4bit_scale"], [GATHERED + "_half"],
        domain="com.microsoft", gather_axis=0, quantize_axis=1, block_size=BLOCK))
    graph.node.insert(at + 1, helper.make_node("Cast", [GATHERED + "_half"], [GATHERED], to=TensorProto.FLOAT))
    model.opset_import.append(helper.make_opsetid("com.microsoft", 1))
    # The external data would be appended to the file already there.
    for name in ["model.onnx", "model.data"]:
        os.remove(os.path.join(out, name))
    onnx.save_model(model, os.path.join(out, "model.onnx"), save_as_external_data=True,
                    all_tensors_to_one_file=True, location="model.data", size_threshold=1024)


def main():
    if sys.argv[1] == "--table4":
        table_in_four_bits(sys.argv[2])
        return
    import torch
    from onnxruntime.quantization import QuantType, quantize_dynamic
    from transformers import AutoModel, AutoTokenizer

    class Encoder(torch.nn.Module):
        def __init__(self, model):
            super().__init__()
            self.model = model

        def forward(self, input_ids, attention_mask):
            # The encoder keeps its positions in a buffer the weights do not fill.
            positions = torch.arange(input_ids.shape[1], device=input_ids.device).unsqueeze(0)
            return self.model(input_ids=input_ids, attention_mask=attention_mask,
                              position_ids=positions).last_hidden_state

    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    tokenizer = AutoTokenizer.from_pretrained(MODEL)
    model = AutoModel.from_pretrained(MODEL, trust_remote_code=True, torch_dtype=torch.float32).eval()
    del model.encoder.layer[LAYERS:]

    with tempfile.TemporaryDirectory() as work:
        whole = os.path.join(work, "whole.onnx")
        small = os.path.join(work, "small.onnx")
        sample = tokenizer("A short sentence to trace the graph with.", return_tensors="pt")
        moving = {0: "texts", 1: "pieces"}
        torch.onnx.export(
            Encoder(model), (sample["input_ids"], sample["attention_mask"]), whole,
            input_names=["input_ids", "attention_mask"], output_names=["hidden"],
            dynamic_axes={"input_ids": moving, "attention_mask": moving, "hidden": moving},
            opset_version=17, dynamo=False,
        )
        quantize_dynamic(whole, small, weight_type=QuantType.QUInt8)
        onnx.save_model(onnx.load(small), os.path.join(out, "model.onnx"), save_as_external_data=True,
                        all_tensors_to_one_file=True, location="model.data", size_threshold=1024)

        tokenizer.save_pretrained(work)
        described = json.load(open(os.path.join(work, "tokenizer.json"), encoding="utf8"))

    vocabulary = described["model"]["vocab"]
    with open(os.path.join(out, "pieces.txt"), "w", encoding="utf8") as pieces:
        for piece, score in vocabulary:
            assert "\n" not in piece and "\t" not in piece
            pieces.write(f"{piece}\t{score!r}\n")
    # The markers and the unknown piece stay, so that the file still describes
    # a tokenizer; everything else is in pieces.txt.
    described["model"]["vocab"] = vocabulary[:4]
    described["added_tokens"] = described["added_tokens"][:4]
    described["post_processor"] = None
    json.dump(described, open(os.path.join(out, "tokenizer.json"), "w", encoding="utf8"), ensure_ascii=False)
    table_in_four_bits(out)

    for name in sorted(os.listdir(out)):
        print(f"{os.path.getsize(os.path.join(out, name)):>11} {name}")


if __name__ == "__main__":
    main()
