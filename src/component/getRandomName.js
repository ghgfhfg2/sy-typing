import { roomFirst, roomSecond } from "@component/db";

export const randomName = () => {
  const random = Math.floor(Math.random() * roomFirst.length);
  const random2 = Math.floor(Math.random() * roomSecond.length);
  const first = roomFirst[random];
  const last = roomSecond[random2];
  const roomName = first + last;
  return roomName;
};
