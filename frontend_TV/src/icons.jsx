const P = {
  leaf: <><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" /><path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12" /></>,
  cloud: <path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9Z" />,
  drop: <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />,
  temp: <path d="M14 4v10.5a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />,
  shield: <path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.7 0C7.5 20.500 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.500-1.200 6.200-2.700a1.200 1.200 0 0 1 1.500 0C14.500 3.800 17 5 19 5a1 1 0 0 1 1 1z" />,
  flask: <><path d="M10 2v7.500a2 2 0 0 1-.2.900L4.700 20.500a1 1 0 0 0 .9 1.500h12.800a1 1 0 0 0 .9-1.500L14.200 10.400a2 2 0 0 1-.2-.9V2" /><path d="M8.500 2h7M7 16h10" /></>,
  activity: <path d="M22 12h-2.500a2 2 0 0 0-1.900 1.500l-2.400 8.400a.25.25 0 0 1-.5 0L9.200 2.200a.25.25 0 0 0-.5 0l-2.400 8.400A2 2 0 0 1 4.500 12H2" />,
  chart: <><path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M18 17V9M13 17V5M8 17v-3" /></>,
  voc: <><path d="M12 12 5 6M12 12l7-6M12 12v8" /><circle cx="12" cy="12" r="2.400" fill="currentColor" /><circle cx="5" cy="6" r="1.800" fill="currentColor" /><circle cx="19" cy="6" r="1.800" fill="currentColor" /><circle cx="12" cy="20" r="1.800" fill="currentColor" /></>,
  pm25: <g fill="currentColor" stroke="none"><circle cx="12" cy="12" r="3.200" />{[[12,4],[12,20],[4,12],[20,12],[6.300,6.300],[17.700,6.300],[6.300,17.700],[17.700,17.700]].map(([x, y]) => <circle key={x + "" + y} cx={x} cy={y} r="1.300" />)}</g>,
  pm10: <g fill="currentColor" stroke="none"><circle cx="12" cy="12" r="4" /><circle cx="5" cy="5" r="1.800" /><circle cx="19" cy="5" r="1.800" /><circle cx="5" cy="19" r="1.800" /><circle cx="19" cy="19" r="1.800" /><circle cx="12" cy="3.500" r="1.200" /><circle cx="12" cy="20.500" r="1.200" /></g>,
};
export default function Icon({ name }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.800" strokeLinecap="round" strokeLinejoin="round">{P[name]}</svg>;
}
