import { Button, Checkbox, Flex, Input, useToast } from "@chakra-ui/react";
import {
  ref,
  set,
  update,
  get,
  query,
  orderByValue,
  equalTo,
  orderByChild,
} from "firebase/database";
import { useRouter } from "next/router";
import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";
import shortid from "shortid";
import styled from "styled-components";
import { roomFirst, roomSecond } from "@component/db";
import { db } from "../firebase";
import { CommonPopup } from "@component/CommonStyled";
import { useForm } from "react-hook-form";
import { randomName } from "@component/getRandomName";
import { format } from "date-fns";
const MainComponent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: calc(100vh - 60px);
`;

export default function Main() {
  const toast = useToast();
  const userInfo = useSelector((state) => state.user.currentUser);

  const router = useRouter();

  const {
    setValue,
    getValues,
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm();

  const onOpenRoom = () => {
    if (userInfo) {
      const roomName = getValues("subject");

      const uid = shortid.generate();
      set(ref(db, `room/${uid}`), {
        uid,
        time: "",
        date: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        writer: userInfo.uid,
        roomName,
        play: false,
        user: {
          [userInfo.uid]: { nick: userInfo.nick },
        },
      }).then(() => {
        router.push(`/play/${uid}`);
      });
    } else {
      toast({
        position: "top",
        title: `로그인 해야 방생성을 하실 수 있습니다.`,
        status: "info",
        duration: 1000,
        isClosable: true,
      });
    }
  };

  const [isOnponePop, setIsOnponePop] = useState(false);
  const onOpenPop = () => {
    setIsOnponePop(true);
    const name = randomName();
    setValue("subject", name);
  };
  const closePop = () => {
    setIsOnponePop(false);
  };

  const [isEnterPop, setIsEnterPop] = useState(false);
  const onEnterPop = () => {
    if (!userInfo) {
      toast({
        position: "top",
        title: `로그인 해야 참여 하실 수 있습니다.`,
        status: "info",
        duration: 1000,
        isClosable: true,
      });
      return;
    }
    setIsEnterPop(true);
  };
  const closeEnterPop = () => {
    setIsEnterPop(false);
  };

  const roomCode = useRef();
  const onEnterRoom = () => {
    const code = roomCode.current.value;
    const rRef = query(
      ref(db, `room`),
      orderByChild("roomName"),
      equalTo(code)
    );
    get(rRef).then((data) => {
      let room = {};
      for (const key in data.val()) {
        room = {
          ...data.val()[key],
        };
      }

      router.push(`play/${room.uid}`);
      update(ref(db, `room/${room.uid}/user/${userInfo.uid}`), {
        nick: userInfo.nick,
      });
    });
  };

  return (
    <>
      <MainComponent>
        {isOnponePop && (
          <CommonPopup>
            <form className="game_box" onSubmit={handleSubmit(onOpenRoom)}>
              <div className="con_box">
                <Flex>
                  <Input
                    id="subject"
                    className="lg"
                    readOnly
                    placeholder="* 제목"
                    {...register("subject", {
                      required: "제목은 필수항목 입니다.",
                    })}
                  />
                  <Checkbox flexShrink="0" ml={3} {...register("hidden")}>
                    비공개
                  </Checkbox>
                </Flex>
                <Flex justifyContent="center" mt={4}>
                  <Button onClick={closePop}>닫기</Button>
                  <Button type="submit" ml={2}>
                    확인
                  </Button>
                </Flex>
              </div>
            </form>
          </CommonPopup>
        )}
        <Button onClick={onOpenPop}>방 생성</Button>
        <Button onClick={onEnterPop} ml={2}>
          방 참여
        </Button>
        {isEnterPop && (
          <CommonPopup>
            <div className="con_box">
              <Input ref={roomCode} placeholder="방 코드를 입력해 주세요." />
              <Flex justifyContent="center" mt={4}>
                <Button onClick={closeEnterPop}>닫기</Button>
                <Button onClick={onEnterRoom} ml={2}>
                  확인
                </Button>
              </Flex>
            </div>
          </CommonPopup>
        )}
      </MainComponent>
    </>
  );
}
