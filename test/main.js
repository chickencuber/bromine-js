
elt("test-app")(function({state}) {
    const count = state.useSignal(0)
    return html`<>
        <my-counter count="${count}"/>
        </>`;
})

elt("my-counter", {
    count: Number,
})(function({
    props: {
        count,
    },
}) {
    return html`<button on:click=${() => count(v=>++v)}>${count}</button>`;
})
