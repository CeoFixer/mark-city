// Camera-relative views keep a drawn character visible from every camera angle.
export function viewDirection(heading,yaw){
  const angle=Math.atan2(Math.sin(heading-yaw),Math.cos(heading-yaw));
  if(Math.abs(angle)<Math.PI/4)return 'front';
  if(Math.abs(angle)>Math.PI*3/4)return 'back';
  return angle>0?'right':'left';
}
