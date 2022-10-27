import { Button, Flex, Input, useToast } from "@chakra-ui/react";
import { ref, set, update } from "firebase/database";
import { useRouter } from "next/router";
import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";
import shortid from "shortid";
import styled from "styled-components";
import { db } from "../firebase";
import { CommonPopup } from "@component/CommonStyled"
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

  const onOpenRoom = () => {
    if (userInfo) {
      const uid = shortid.generate();
      set(ref(db, `room/${uid}`), {
        uid,
        writer: userInfo.uid,
        play:false
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

  const [isEnterPop, setIsEnterPop] = useState(false)
  const onEnterPop = () => {
    setIsEnterPop(true)
  }
  const closeEnterPop = () => {
    setIsEnterPop(false)
  }

  const roomCode = useRef()
  const onEnterRoom = () => {
    const code = roomCode.current.value;
    router.push(`play/${code}`)
    update(ref(db,`room/${code}/user/${userInfo.uid}`),{
      nick:userInfo.nick,
    })
  }

  return (
    <MainComponent>
      <Button onClick={onOpenRoom}>방 생성</Button>
      <Button onClick={onEnterPop} ml={2}>방 참여</Button>
      {isEnterPop &&
        <CommonPopup>
          <div className="con_box">
            <Input ref={roomCode} placeholder="방 코드를 입력해 주세요." />
            <Flex justifyContent="center" mt={4}>
              <Button onClick={closeEnterPop}>닫기</Button>
              <Button onClick={onEnterRoom} ml={2}>확인</Button>
            </Flex>
          </div>
        </CommonPopup>
      }
    </MainComponent>
  );
}
