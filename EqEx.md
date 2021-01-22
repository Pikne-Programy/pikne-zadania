# Equation Exercise (EqEx) specification v0.1
All the EqEx files are [the Exercise ones](Exercise) with `type` being `EqEx` or `EquationExercise`.
There are no additional keys in the header.
One can divide the content into two parts: a text and calculations. The separator between them is the line with `---` only.
## The text
Text is a text with added variables (knowns and unknowns). The special-use character for creating a variable is `=`. There is a variable name (like `x` or `v_1`) right (without any whitespace) before the `=`.  It can contain alphabetical characters (both upper- and lowercase) and the underscore which indicates subscript.

Right after `=`, there is an expression which can be:
 - a constant (numeric) in:
    - decimal notation (like `4` or `-0.911`)
    - scientific notation (like `1.234e5` or `1e-3`)
 - a range \
   The range specifies the interval of numbers among which the number randomise. It is in the format `[start;stop(;step)]`. The expression `[1;4;1]` will give a random number from the set `{1,2,3,4}`. However, the third argument `step` is optional. When is omitted, it produces the result rounded to 3 significant figures.
 - a question mark (?) \
   The question mark indicates that the variable is unknown, and there should be a calculation of it in calculations part.

Right after the expression, there should be a unit of the scalar. Each one consists of subunits which all must be in alphabetical form. One can raise them to the integer power (like `km^2`), multiply them (like `km^2*s`) or indicate the denominator part (`a/b*c` will be recognised as `(a)/(b*c)`)

## Calculations
Each line of calculations must have a special-use `=` character which splits it into a variable name and an equation. There can be auxiliary variables not mentioned in the text part. But each declared unknown must be assigned to an equation. Each equation has to use above-declared variables.

### Equation
