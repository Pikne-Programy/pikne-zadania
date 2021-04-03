# Equation Exercise (EqEx) specification v0.2
Equation Exercise is an answer only oriented type of Exercise. The file was specifically designed for physics problems but can be used for any answer only exercises. <br/>
The file consists of three segments: the **Header**, the **Text** and the **Calculations**. The separator between them is the line with `---` only. In particular, the file starts with `---`.

## Header
The header defines respectively fields:
* **type**: EqEx (static for this type of exercise)
* **name**: the name of the exercise
* **img**: the name of exercise's image (optional)

## Text
The text is the exercise's content with specified types and values of all the variables.
Such specification has the format:
* **variable name**: begins with a letter and can consist of Latin alphabet letters (upper- and lowercase), numbers, some special characters (`'`) and an underscore (one per name) <br/>
Notice that all greek letters will be replaced with the corresponding symbol.
* `=`
* **value**: depends on the type of the variable, specified below.
* **unit**: units of the scalar commonly used in physics. They can also consist of multiplied or rased to integer power subunits. `/` symbol indicates the denominator part and can be used only once per unit (`a/b*c` will be recognised as `(a)/(b*c)`) <br/>
Notice that units similar to `1/s` should be written as `/s`. In addition `deg` will be replaced with Unicode's `°` <br/>
e.g. `g=...m/s^2`, `W=...F*s`, `f=.../s`

There are three types of variables in the EqEx format:
* **constant (numeric)**:  variable has a predetermined value. The value is a number written in decimal notation (`1`, `-0.5`) or scientific notation (`1.234e5`, `1e-3`) <br/>
e.g. `x=1e-5s`
* **range**: variable value is between predetermined boundaries. Arguments in the range are passed between `[` and `]` and are separated by `;` (without any whitespace between). <br/>
**range format**: `[` minimal value `;` maximal value `;` step `]`<br/>
Notice that step is optional. When omitted, the value would be rounded to 3 figures after the decimal. <br/>
e.g. `x=[0;5;1]` would yield `x=` one of `0, 1, 2, 3, 4, 5`
* **unknown**: variable defined in **the calculation** part. All the unknowns are in query. Unknowns are defined by `?` character instead of its value.<br/>
e.g. `x=?m/s`

## Calculations
Each line of calculations must have a special-use `=` character which splits it into a variable name and an equation. There can be auxiliary variables not mentioned in the text part. But each declared unknown must be assigned to an equation. Each equation has to use the above-declared variables.

### Equation
