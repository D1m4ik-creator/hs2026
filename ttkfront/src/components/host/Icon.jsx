export const Icon = ({ name, size = 18 }) => {
  const icons = {
    play:     <polygon points="5,3 19,12 5,21" fill="currentColor" />,
    pause:    <><rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/></>,
    volume:   <><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="2" fill="none"/></>,
    shuffle:  <><polyline points="16,3 21,3 21,8" stroke="currentColor" strokeWidth="2" fill="none"/><line x1="4" y1="20" x2="21" y2="3" stroke="currentColor" strokeWidth="2"/><polyline points="21,16 21,21 16,21" stroke="currentColor" strokeWidth="2" fill="none"/><line x1="15" y1="15" x2="21" y2="21" stroke="currentColor" strokeWidth="2"/></>,
    loop:     <><polyline points="17,1 21,5 17,9" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M3 11V9a4 4 0 0 1 4-4h14" stroke="currentColor" strokeWidth="2" fill="none"/><polyline points="7,23 3,19 7,15" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M21 13v2a4 4 0 0 1-4 4H3" stroke="currentColor" strokeWidth="2" fill="none"/></>,
    trash:    <><polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M19,6l-1,14H6L5,6" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M10,11v6M14,11v6" stroke="currentColor" strokeWidth="2" fill="none"/></>,
    plus:     <><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2"/></>,
    upload:   <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" fill="none"/><polyline points="17,8 12,3 7,8" stroke="currentColor" strokeWidth="2" fill="none"/><line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2"/></>,
    mic:      <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" fill="none"/><line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2"/></>,
    send:     <><line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2"/><polygon points="22,2 15,22 11,13 2,9" fill="currentColor"/></>,
    check:    <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2" fill="none"/>,
    dblcheck: <><polyline points="17,6 9,17 5,13" stroke="currentColor" strokeWidth="2" fill="none"/><polyline points="22,6 14,17 11,14.5" stroke="currentColor" strokeWidth="2" fill="none"/></>,
    music:    <><path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" fill="none"/></>,
    list:     <><line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/><line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2"/><line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" strokeWidth="2"/></>,
    close:    <><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/></>,
    next:     <><polygon points="5,4 15,12 5,20" fill="currentColor"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"/></>,
    prev:     <><polygon points="19,20 9,12 19,4" fill="currentColor"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2"/></>,
    image:    <><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2" fill="none"/></>,
    logout:   <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" fill="none"/><polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" fill="none"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2"/></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      {icons[name]}
    </svg>
  )
}