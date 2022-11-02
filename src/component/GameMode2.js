import { Flex, Input, useToast } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { db } from "../firebase";
import {
  ref,
  get,
  set,
  update,
  runTransaction,
  onValue,
  off,
  remove,
  onDisconnect,
} from "firebase/database";
import { enWord, enWord2, roomFirst, roomSecond, wordList } from "./db";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function GameMode2({
  roomData,
  userInfo,
  timeTxt,
  onTyping,
  timeCounter,
}) {
  const toast = useToast();
  const router = useRouter();

  const {
    handleSubmit,
    setValue,
    getValues,
    register,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    const rRef = ref(db, `room/${router?.asPath.split("/")[2]}`);
    onValue(rRef, (data) => {
      let obj = {
        ...data.val(),
      };
      let arr = [];
      for (const key in data.val()?.user) {
        arr.push({
          nick: data.val().user[key].nick,
          point: data.val().user[key].point || 0,
          speed: data.val().user[key].speed || 0,
          uid: key,
        });
      }
      arr = arr.sort((a, b) => b.point - a.point);
      obj.user = arr;
      if (!obj.uid) {
        router.push("/");
      }
      console.log(obj);
    });
    return () => {
      off(rRef);
    };
  }, []);

  const onSubmit = () => {};

  return (
    <div className="game_box">
      <div className="time_counter">{timeTxt}</div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Flex>
          <Input
            onInput={onTyping}
            placeholder="입력 후 enter"
            type="text"
            {...register("answer")}
            disabled={timeCounter === 0 ? true : false}
          />
        </Flex>
      </form>
    </div>
  );
}
