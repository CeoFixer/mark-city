// Only suggest activities that exist in this version of the city.
const activities=[
 [/ДИСКО/, 'Диско', 'можно зайти, послушать электронную музыку и посмотреть на диджея'],
 [/Книги/, 'Книжный магазин «Филд Парк»', 'можно зайти и рассмотреть книжные полки'],
 [/МЕГАЗИН/, 'Мегазин', 'можно зайти и осмотреть прилавок с хлебом'],
 [/ФУД МАРТ/, 'Фуд Март', 'можно зайти и посмотреть, как устроен магазин'],
 [/школа/i, 'Школа Тиурба', 'можно зайти в класс, посмотреть на парты и доску'],
 [/ЛОББИ/, 'Лобби Violet', 'можно зайти и осмотреть комнату с диваном'],
 [/МОТЕЛЬ/, 'Violet Motel', 'можно зайти внутрь и осмотреть комнату']
];
export function nearbyActivities(position,buildings){
 const places=[{name:'Филд Парк',x:20,z:21,activity:'можно посидеть на лавке: подойди к ней и нажми E'}];
 for(const building of buildings){
  const match=activities.find(([pattern])=>pattern.test(building.name));
  if(match)places.push({name:match[1],activity:match[2],x:building.doorX??building.x,z:building.doorZ??building.z});
 }
 const place=places.reduce((a,b)=>Math.hypot(a.x-position.x,a.z-position.z)<=Math.hypot(b.x-position.x,b.z-position.z)?a:b);
 return `Ближе всего — ${place.name}${place.z*position.z<0?' через главную улицу':''}: ${place.activity}.`;
}
