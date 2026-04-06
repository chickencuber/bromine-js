<img src="./bromine.svg" width="500" height="500">

# BromineJS
a reactive library for defining web components

```js
elt("my-counter", {
    count: Number,
})(function({
    props: {
        count,
    },
    state,
}) {
    const color = state.useStyle("--color") 
    return html`
        <>
        <button style="background: ${color}" on:click=${() => count(v => ++v)}>${count}</button>
        <slot></slot>
        </>
        `
})
```
and then it can just be used in html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <link rel="stylesheet" type="text/css" href="style.css">
    <meta charset="utf-8" />
    <script src="../dist/lib.js"></script>
  </head>
  <body>
    <main>
        <my-counter count="0"></my-counter>
    </main>
    <script src="main.js"></script>
  </body>
</html>
```

