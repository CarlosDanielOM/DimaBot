function formatBadges(tags) {
    if(!tags || !tags['badge-info'] || !tags.badges) {
        return [];
    }

    let labels = [];
    const badges = tags.badges
    const badgeInfo = tags['badge-info'] || {};

    if(badges.broadcaster) {
        labels.push('[STREAMER]');
    } else if(badges.moderator) {
        labels.push('[MOD]');
    } else if(badges.vip) {
        labels.push('[VIP]');
    } 
    
    if(badges.founder) {
        let months = badgeInfo.subscriber || 0;
        labels.push(`[FOUNDER ${months}M]`);
    } else if (badges.subscriber) {
        let months = badgeInfo.subscriber || 0;
        labels.push(`[SUB ${months}M]`);
    }

    if(badges.premium) labels.push('[PRIME]');
    if(badges.partner) labels.push('[PARTNER]');
    if(badges.staff) labels.push('[STAFF]');
    if(badges.turbo) labels.push('[TURBO]');
    if(badges['sub-gifter']) labels.push('[SUB-GIFTER]');

    return labels.length > 0 ? labels.join(' ') + ' ' : '';
}

module.exports = formatBadges;