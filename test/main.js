elt("test-app")(function({state}) {
    const count = state.useSignal(0);

    const cc = state.useSignal(0);

    const i = setInterval(() => {
        cc(v=>++v)
    }, 1000)
    state.onUnmount(() => clearInterval(i))
    state.useEffect(() => {
        cc(v=>++v)
    }, [count])

    return html`<>
        <my-counter count="${count}"/>
        <br/>
        ${cc}
        <br-if value="${state.useDerived(()=>cc()>=10, [cc])}">
            <div slot="then">hello</div>
        </br-if>
        </>`;
})

elt("my-counter", {
    count: Number,
})(function({
    props: {
        count,
    },
}) {
    return html`<>
        <button onclick=${() => count(v => ++v)}>${count}</button>
        </>`;
})

