elt("test-app")(function({state}) {
    const count = state.useSignal(0, Number)
    const double = state.useDerived(()=>count()*2, [count], {
        backprop: v=>{
            count(v/2)
        },
        force: Number,
    });
    return html`<>
        <my-counter count=${count}/>
        <br/>
        <my-counter count=${double} change=2/>
        </>`;
})

elt("my-counter", {
    count: Number,
    change: [Number, 1],
})(function({
    props: {
        count,
        change,
    },
}) {
    return html`<button on:click=${() => count(v=>v+change())}>${count}</button>`;
})
