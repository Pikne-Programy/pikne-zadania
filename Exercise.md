# Exercise specification
At the beginning of each Exercise file, there is a header in [YAML format](https://yaml.org/spec/1.2/spec.html).
There are two lines with a separator (`---`) only, and the header is between them.
The required keys are `type` (string) and `name` (string). All the others are ExT-dependent (Exercise Type dependent).
There is ExT-dependent content after the second separator.
## Example
``` yaml
---
type: "EqEx"
name: "Sample name"
imgs:
 - first image.jpg
 - second image.jpg
---
g=9.81
```
