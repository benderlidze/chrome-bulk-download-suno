function getUrlList() {
    const gridElement = document.querySelector('[role="grid"]');
    const reactPropsKey = Object.keys(gridElement).find(key => key.startsWith('__reactProps'));
    const collection = gridElement[reactPropsKey].children[0].props.values[0][1].collection;

    return Array.from(collection.keyMap).map(item => {
        const obj = item[1];
        return {
            link: obj.value.audio_url,
            name: obj.value.title || obj.value.id
        };
    }).filter(item => item.link);
}

window.postMessage({ type: "FROM_PAGE", data: getUrlList() }, "*");