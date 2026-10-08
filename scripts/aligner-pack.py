"""Makes the four files the word aligner reads (src-tauri/src/align.rs) out of
the published model, into the folder named:

    python scripts/aligner-pack.py <folder>

Wants torch, transformers 4.x (the model's own code does not load in 5),
onnx, onnxruntime and tokenizers; nothing here is part of the app's build.

What is done to the model, each step measured before it was taken:

  - the five layers above the seventh are dropped: the links are read off
    the seventh, and not one of them changes;
  - the weights are rounded to 8 bits;
  - they are written to a file of their own, model.data, which ONNX Runtime
    maps from the disk instead of copying into memory;
  - the tokenizer's quarter of a million pieces go to pieces.txt, one a line
    with its score, the line's number its id, and tokenizer.json keeps only
    how a text is tidied and split into words.

The files a build packs are the attachments of the release `aligner-1`
(scripts/aligner-fetch.mjs, which holds their checksums), beside a NOTICE.txt
naming the model they come from and its license. A new pack is a new
release and new checksums there.
"""

import json
import os
import sys
import tempfile

import onnx
import torch
from onnxruntime.quantization import QuantType, quantize_dynamic
from transformers import AutoModel, AutoTokenizer

MODEL = "WPS-Qingqiu/OmniAlign"
LAYERS = 7


class Encoder(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, input_ids, attention_mask):
        # The encoder keeps its positions in a buffer the weights do not fill.
        positions = torch.arange(input_ids.shape[1], device=input_ids.device).unsqueeze(0)
        return self.model(input_ids=input_ids, attention_mask=attention_mask, position_ids=positions).last_hidden_state


def main():
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

    for name in sorted(os.listdir(out)):
        print(f"{os.path.getsize(os.path.join(out, name)):>11} {name}")


if __name__ == "__main__":
    main()
