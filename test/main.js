elt("test-app")(function({state}) {
    const count = state.useSignal(0);
    const count2 = state.useDerived(() => count()*2, [count])

    const cc = state.useSignal(0);

    const color = state.useSignal("red");

    const i = setInterval(() => {
        cc(v=>++v)
    }, 1000)
    state.onUnmount(() => clearInterval(i))

    return html`
        <>
        <my-counter count="${count}"/>
        <br>
        ${count2}
        <br>
        <my-counter count="${cc}" style="--color:${color}">
        <br>
        ${cc}
        </my-counter>
        <button onclick=${()=>color("red")}>red</button>
        <button onclick=${()=>color("blue")}>blue</button>
        </>
        `
})

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
        <button style="background: ${color}" onclick=${() => count(v => ++v)}>${count}</button>
        <slot></slot>
        </>
        `
})

