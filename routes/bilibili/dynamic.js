const axios = require('../../utils/axios');
const JSONbig = require('json-bigint');

module.exports = async (ctx) => {
    const uid = ctx.params.uid;

    const response = await axios({
        method: 'get',
        url: `https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/space_history?host_uid=${uid}`,
        headers: {
            Referer: `https://space.bilibili.com/${uid}/`,
        },
        transformResponse: [(data) => data],
    });
    const data = JSONbig.parse(response.data).data.cards;

    ctx.state.data = {
        title: `${data[0].desc.user_profile.info.uname} 的 bilibili 动态`,
        link: `https://space.bilibili.com/${uid}/#/dynamic`,
        description: `${data[0].desc.user_profile.info.uname} 的 bilibili 动态`,
        item: data.map((item) => {
            const parsed = JSONbig.parse(item.card);
            const data = parsed.item || parsed;
            const origin = parsed.origin ? JSONbig.parse(parsed.origin) : null;

            // img
            let imgHTML = '';
            if (data.pictures) {
                for (let i = 0; i < data.pictures.length; i++) {
                    imgHTML += `<img referrerpolicy="no-referrer" src="${data.pictures[i].img_src}">`;
                }
            }
            if (data.pic) {
                imgHTML += `<img referrerpolicy="no-referrer" src="${data.pic}">`;
            }

            // link
            let link = '';
            if (data.dynamic_id) {
                link = `https://t.bilibili.com/${data.dynamic_id}`;
            } else if (item.desc && item.desc.dynamic_id) {
                link = `https://t.bilibili.com/${item.desc.dynamic_id}`;
            }

            const getDes = (data) => data.desc || data.description || data.content || data.summary || (data.vest && data.vest.content) + (data.sketch && data.sketch.title);

            return {
                title: data.title || data.description || data.content || (data.vest && data.vest.content),
                description: `${getDes(data)}${origin ? `<br><br>转发自: @${(origin.user && origin.user.uname) || (origin.owner && origin.owner.name)}: ${getDes(origin.item || origin)}` : ''}${imgHTML} `,
                pubDate: new Date(item.desc.timestamp * 1000).toUTCString(),
                link: link,
            };
        }),
    };
};
