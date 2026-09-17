# A window of its own with a text in it, selected, for the shortcut to read
# and for Insert to write into — so a test never types into the reader's own
# programs. Stays open until closed; its text is written to textbox.txt on
# every change.
param([string]$Text = "El gato duerme en la ventana.")
Add-Type -AssemblyName System.Windows.Forms
$form = New-Object System.Windows.Forms.Form
$form.Text = "Triglosa test"
$form.Width = 700; $form.Height = 220; $form.StartPosition = "Manual"; $form.Left = 900; $form.Top = 700
$box = New-Object System.Windows.Forms.TextBox
$box.Multiline = $true; $box.Dock = "Fill"; $box.Font = New-Object System.Drawing.Font("Segoe UI", 14)
$box.Text = $Text
$box.Add_TextChanged({ Set-Content C:\triglosa-tools\textbox.txt $box.Text -Encoding UTF8 })
# A multiline Windows Forms box does not know Ctrl+A by itself.
$box.Add_KeyDown({ if ($_.Control -and $_.KeyCode -eq "A") { $box.SelectAll(); $_.SuppressKeyPress = $true } })
$form.Controls.Add($box)
$form.Add_Shown({ $form.Activate(); $box.Focus(); $box.SelectAll() })
[void]$form.ShowDialog()
