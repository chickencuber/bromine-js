elt("test-app")(function({ state }) {
    const count = state.useSignal(0, Number)
    const double = state.useDerived(() => count() * 2, [count], {
        backprop: v => {
            count(v / 2)
        },
        force: Number,
    });
    return html`<>
        <my-counter count=${count}/>
        <br/>
        <br-if value="${state.useDerived(() => count() > 10, [count])}">
        <my-counter count=${double} change=2 slot="then"/>
        </br-if>

        </>`;
})

function fakeRequest() {
    return new Promise(r => setTimeout(() => r(), 10 * 1000)); //10 seconds
}

elt("my-counter", {
    count: Number,
    change: [Number, 1],
})(function*({
    props: {
        count,
        change,
    }
}) {
    yield html`<>
            waiting...
            <button on:click=${() => count(v => v + change())}>${count}</button>
            </>`;
    yield fakeRequest();
    return html`<>
        done
        <button on:click=${() => count(v => v + change())}>${count}</button>
        </>`;
})
