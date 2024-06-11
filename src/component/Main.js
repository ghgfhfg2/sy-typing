import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Radio,
  RadioGroup,
  Stack,
  useToast,
} from "@chakra-ui/react";
import {
  ref,
  set,
  update,
  get,
  query,
  orderByValue,
  equalTo,
  orderByChild,
  onValue,
} from "firebase/database";
import { useRouter } from "next/router";
import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";
import shortid from "shortid";
import styled from "styled-components";
import { roomFirst, roomSecond } from "@component/db";
import { db } from "../firebase";
import { CommonPopup, RoomList } from "@component/CommonStyled";
import { useForm } from "react-hook-form";
import { randomName } from "@component/getRandomName";
import { format, getTime } from "date-fns";
import { HiOutlineArrowSmRight } from "react-icons/hi";
import RankingPop from "./RankingPop";
const MainComponent = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: auto;
  min-height: 50vh;
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

  const [modeState, setModeState] = useState("1");
  const onModeChange = (e) => {
    setModeState(e);
  };

  const onOpenRoom = (data) => {
    if (userInfo) {
      const roomName = getValues("subject");

      const uid = shortid.generate();
      set(ref(db, `room/${uid}`), {
        uid,
        time: "",
        date: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        writer: userInfo.uid,
        roomName,
        mode: modeState,
        play: false,
        hidden: data.hidden,
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
  const [openRoomList, setOpenRoomList] = useState();
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
    } else {
      const rRef = query(ref(db, `room`), orderByChild("play"), equalTo(false));
      onValue(rRef, (data) => {
        const list = data.val();
        let arr = [];
        for (const key in list) {
          if (!list[key].hidden) {
            arr.push(list[key]);
          }
        }
        arr = arr.sort((a, b) => {
          const aTime = getTime(new Date(a.date));
          const bTime = getTime(new Date(b.date));
          return bTime - aTime;
        });
        arr.slice(0, 10);
        setOpenRoomList(arr);
      });
      setIsEnterPop(true);
    }
  };
  const closeEnterPop = () => {
    setIsEnterPop(false);
  };

  const roomCode = useRef();
  const onEnterRoom = (uid) => {
    if (uid) {
      router.push(`play/${uid}`);
      update(ref(db, `room/${uid}/user/${userInfo.uid}`), {
        nick: userInfo.nick,
      });
    } else {
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
    }
  };

  const [isRankingPop, setIsRankingPop] = useState(false);
  const onRanking = () => {
    setIsRankingPop(true);
  };
  const closeRankPop = () => {
    setIsRankingPop(false);
  };

  return (
    <>
      <MainComponent>
        {isOnponePop && (
          <CommonPopup>
            <form className="con_box" onSubmit={handleSubmit(onOpenRoom)}>
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
              <FormControl isInvalid={errors.mode}>
                <Flex mt={5}>
                  <FormLabel pl={1} mr={5} className="label">
                    게임모드
                  </FormLabel>
                  <RadioGroup
                    defaultValue={modeState}
                    onChange={onModeChange}
                    value={modeState}
                  >
                    <Stack spacing="20px" direction="row">
                      <Radio value="1">기본</Radio>
                      <Radio value="2">흩뿌리기</Radio>
                      <Radio value="3">헬파티</Radio>
                    </Stack>
                  </RadioGroup>
                </Flex>
                <FormErrorMessage>
                  {errors.mode && errors.mode.message}
                </FormErrorMessage>
              </FormControl>
              <Flex justifyContent="center" mt={4}>
                <Button colorScheme="blue" type="submit" mr={2}>
                  확인
                </Button>
                <Button onClick={closePop}>닫기</Button>
              </Flex>
            </form>
          </CommonPopup>
        )}
        <Flex
          flexDirection="column"
          gap={3}
          style={{ width: "90vw", maxWidth: "400px" }}
        >
          <Button width="100%" onClick={onOpenPop} colorScheme="blue">
            방 생성
          </Button>
          <Button width="100%" onClick={onEnterPop}>
            방 참여
          </Button>
          <Button width="100%" onClick={onRanking} mt={5}>
            랭킹보기
          </Button>
        </Flex>
        {isEnterPop && (
          <CommonPopup>
            <div className="con_box">
              {openRoomList && openRoomList.length > 0 && (
                <RoomList>
                  <h2>
                    공개방
                    <span style={{ fontSize: "12px", marginLeft: "5px" }}>
                      *최근 생성된 10개만 노출됩니다.
                    </span>
                  </h2>
                  {openRoomList.map((el, idx) => (
                    <li key={el.uid} onClick={() => onEnterRoom(el.uid)}>
                      {el.roomName}
                      <HiOutlineArrowSmRight />
                    </li>
                  ))}
                </RoomList>
              )}
              <Input ref={roomCode} placeholder="방 코드로 입장" />
              <Flex justifyContent="center" mt={4}>
                <Button onClick={onEnterRoom} mr={2} colorScheme="blue">
                  확인
                </Button>
                <Button onClick={closeEnterPop}>닫기</Button>
              </Flex>
            </div>
          </CommonPopup>
        )}
        {isRankingPop && <RankingPop closeRankPop={closeRankPop} />}
      </MainComponent>
    </>
  );
}
