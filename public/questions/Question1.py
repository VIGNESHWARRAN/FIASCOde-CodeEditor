num = 123456789

digits = []
while num:
    num, digit = divmod(num, 10)
    digits.append(str(digit))

digits.reverse()
print("+".join(digits))