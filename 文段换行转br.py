import pyperclip

text = pyperclip.paste()
print("==========================================")
print(text)
print("==========================================")
text = text.replace("\n", "<br>\n")
print(text)
print("==========================================")
pyperclip.copy(text)
input("成功！")
