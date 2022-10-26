import { Button, useToast } from "@chakra-ui/react";
import { ref, set } from "firebase/database";
import { useRouter } from "next/router";
import React from "react";
import { useSelector } from "react-redux";
import shortid from "shortid";
import styled from "styled-components";
import { db } from "../firebase";
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

  return (
    <MainComponent>
      <Button onClick={onOpenRoom}>방 생성</Button>
    </MainComponent>
  );
}
