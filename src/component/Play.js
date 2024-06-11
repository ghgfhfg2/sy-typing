import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { setUser } from "@redux/actions/user_action";
import { GiSandsOfTime } from "react-icons/gi";
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
  query,
} from "firebase/database";
import { enWord, enWord2, roomFirst, roomSecond, wordList } from "./db";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Radio,
  RadioGroup,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Spinner,
  Stack,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { useRouter } from "next/router";
import { getRanWord } from "./getRandomName";
import { PlayBox } from "@component/CommonStyled";

export default function Main() {
  const toast = useToast();
  const router = useRouter();
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.user.currentUser);

  const {
    handleSubmit,
    setValue,
    getValues,
    register,
    formState: { errors, isSubmitting },
  } = useForm();

  const [sliderValue, setSliderValue] = useState(2);

  const [timeCounter, setTimeCounter] = useState();
  const [readyCounter, setReadyCounter] = useState();
  const [timeTxt, setTimeTxt] = useState();

  const [roomData, setRoomData] = useState();

  const [showWord, setShowWord] = useState("");
  const [wordLeng, setWordLeng] = useState(0);
  const [wordLeng2, setWordLeng2] = useState(0);

  const [gameState, setGameState] = useState(0); // 0: 대기, 1: 진행, 2: 종료

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
      setRoomData(obj);
      if (data.val()?.wordIndex) {
        const idx = data.val().wordIndex[0];
        const idx2 = data.val().wordIndex[1];
        const leng = data.val().wordLeng[0];
        const leng2 = data.val().wordLeng[1];
        setWordLeng(leng);
        setWordLeng2(leng2);
        setShowWord(getRanWord(idx, idx2, data.val().type));
      }
    });
    return () => {
      off(rRef);
    };
  }, []);

  useEffect(() => {
    if (roomData?.play === true) {
      setTimeCounter(roomData.time * 6); //임시타이머
      setReadyCounter(3);
    }
  }, [roomData?.play]);

  //카운터
  useEffect(() => {
    if (gameState !== 1) {
      return;
    }
    const rRef = ref(db, `room/${router?.asPath.split("/")[2]}`);
    if (readyCounter > 0) {
      setTimeout(() => {
        setReadyCounter((prev) => prev - 1);
        setTimeTxt(`${readyCounter}초후 시작합니다.`);
      }, 1000);
    }
    if (readyCounter === 0 && timeCounter > 0) {
      setTimeout(() => {
        if (roomData.uid) {
          update(rRef, {
            state: "start",
          });
          setTimeCounter((prev) => prev - 1);
          setTimeTxt(timeCounter);
        }
      }, 1000);
    }
    if (timeCounter === 0) {
      setTimeout(() => {
        gameEnd();
      }, 1000);
      // setTimeout(() => {
      //   gameInit();
      // }, 5000);
    }
  }, [timeCounter, readyCounter, gameState]);

  const rankingUpdate = async () => {
    const rankRef = query(
      ref(db, `ranking/mode_${roomData.type}/time_${roomData.time}`)
    );
    const getRankScore = await get(rankRef).then((data) => data.val());
    const curRankList = roomData.user
      .map((el) => {
        el.score = Math.floor(el.point * el.speed);
        return el;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    if (!getRankScore) {
      update(ref(db, `ranking/mode_${roomData.type}/time_${roomData.time}`), {
        ...curRankList,
      });
    } else {
      const newRankList = [...getRankScore, ...curRankList]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      update(ref(db, `ranking/mode_${roomData.type}/time_${roomData.time}`), {
        ...newRankList,
      });
    }
  };

  const gameEnd = () => {
    setTimeTxt("end");
    setGameState(2);
    update(ref(db, `room/${roomData.uid}`), {
      state: "end",
      play: false,
    });
    rankingUpdate(); //랭킹업데이트
  };

  const gameInit = () => {
    const scoreInitUser = {};
    roomData.user.forEach((el) => {
      el.point = 0;
      el.speed = 0;
      scoreInitUser[el.uid] = el;
    });

    setGameState(0);
    update(ref(db, `room/${roomData.uid}`), {
      state: "",
      user: scoreInitUser,
    });
    setTimeTxt("");
  };

  //페이지 이동시 방폭
  const routeChangeStart = () => {
    if (!roomData) {
      router.events.emit("routeChangeError");
      throw "Abort route change. Please ignore this error.";
    }
    if (roomData.writer === userInfo.uid) {
      const routerConfirm = confirm(
        "방장이 방을 나가면 방이 삭제됩니다.\n나가시겠습니까?"
      );
      if (!routerConfirm) {
        router.events.emit("routeChangeError");
        throw "Abort route change. Please ignore this error.";
      } else {
        remove(ref(db, `room/${roomData.uid}`));
        toast({
          position: "top",
          title: `방이 삭제되었습니다.`,
          status: "info",
          duration: 1000,
          isClosable: true,
        });
      }
    } else {
      remove(ref(db, `room/${roomData.uid}/user/${userInfo.uid}`));
    }
  };

  useEffect(() => {
    router.events.on("routeChangeStart", routeChangeStart);
    return () => {
      router.events.off("routeChangeStart", routeChangeStart);
    };
  }, [roomData?.uid, router.events]);

  if (roomData && userInfo) {
    if (roomData.writer !== userInfo.uid) {
      const onRef = onDisconnect(
        ref(db, `room/${roomData.uid}/user/${userInfo.uid}`)
      );
      onRef.remove();
    } else {
      const onRef = onDisconnect(ref(db, `room/${roomData.uid}`));
      onRef.remove();
    }
  }

  const [timer, setTimer] = useState();
  const [count, setCount] = useState(0);
  const onTyping = (e) => {
    const val = e.target.value;
    const inputVal = e.nativeEvent.data;
    if (inputVal) {
      setCount((prev) => {
        return prev + 1;
      });
      if (!timer) {
        setTimer(new Date().getTime());
      }
    } else {
      setCount((prev) => {
        return prev - 1;
      });
    }
    if (!val) {
      setCount(0);
      setTimer("");
    }
  };

  const [typeState, setTypeState] = useState("1");
  const onTypeChange = (e) => {
    setTypeState(e);
  };

  const onPlayGame = async () => {
    let wordLeng;
    let wordLeng2;
    let ranIndex;
    let ranIndex2;
    if (typeState === "1") {
      wordLeng = roomFirst.length;
      wordLeng2 = roomSecond.length;
      ranIndex = Math.floor(Math.random() * wordLeng);
      ranIndex2 = Math.floor(Math.random() * wordLeng2);
    } else {
      wordLeng = enWord.length;
      wordLeng2 = enWord2.length;
      ranIndex = Math.floor(Math.random() * wordLeng);
      ranIndex2 = Math.floor(Math.random() * wordLeng2);
    }
    await update(ref(db, `room/${roomData.uid}`), {
      play: true,
      time: sliderValue,
      type: typeState,
      wordLeng: [wordLeng, wordLeng2],
      wordIndex: [ranIndex, ranIndex2],
    });
    setGameState(1);
  };

  const onSubmit = (e) => {
    const answer = e.answer;
    if (answer === showWord) {
      const lastTime = new Date().getTime();
      const distanceTime = lastTime - timer;
      const calcNum = Math.floor(60000 / distanceTime);
      const speed = calcNum * count;
      const ranIndex = Math.floor(Math.random() * wordLeng);
      const ranIndex2 = Math.floor(Math.random() * wordLeng2);
      const updates = {};
      updates[`room/${roomData.uid}/wordIndex`] = [ranIndex, ranIndex2];

      const userPath = `room/${roomData.uid}/user/${userInfo.uid}`;
      get(ref(db, `${userPath}`)).then((data) => {
        const newPoint = data.val().point ? data.val().point + 1 : 1;
        const oldSpeed = data.val().speed || 0;
        const newSpeed = Math.floor(
          (oldSpeed * data.val().point + speed) / newPoint
        );
        if (oldSpeed) {
          update(ref(db, `${userPath}`), {
            speed: newSpeed,
            point: newPoint,
          });
        } else {
          update(ref(db, `${userPath}`), {
            speed,
            point: newPoint,
          });
        }
      });

      update(ref(db), updates)
        .then(() => {
          setValue("answer", "");
          toast({
            position: "top",
            title: `입력성공! 타자속도 ${speed}타/분 입니다.`,
            status: "success",
            duration: 1000,
            isClosable: true,
          });
        })
        .then(() => {
          setCount(0);
          setTimer("");
        });
    } else {
      toast({
        position: "top",
        title: `정확하게 입력해 주세요.`,
        status: "error",
        duration: 1000,
        isClosable: true,
      });
      setCount(0);
      setTimer("");
      setValue("answer", "");
    }
  };

  return (
    <PlayBox>
      {roomData && (
        <>
          {roomData.roomName && (
            <div className="code_name">방 코드네임 : {roomData.roomName}</div>
          )}
          <Flex className="flex_con">
            <ul className="user_list">
              <li className="header">
                <span className="rank">순위</span>
                <span className="user">유저</span>
                <span className="point">점수</span>
                <span className="speed">평균타수</span>
              </li>
              {roomData.user.map((el, idx) => (
                <li className="body" key={el.uid}>
                  <span className="rank">{idx + 1}</span>
                  <span className="user">{el.nick}</span>
                  <span className="point">{el.point}</span>
                  <span className="speed">{el.speed}</span>
                </li>
              ))}
            </ul>
            {roomData.play === true ? (
              <div className="game_box">
                <div className="time_counter">{timeTxt}</div>
                {roomData.state === "start" && (
                  <div className="text_box">{showWord}</div>
                )}
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
            ) : (
              <>
                {roomData.writer === userInfo?.uid && gameState === 0 ? (
                  <form className="game_box" onSubmit={handleSubmit(onSubmit)}>
                    <Flex
                      maxWidth={400}
                      width="100%"
                      minHeight="50vh"
                      flexDirection="column"
                      alignItems="center"
                      gap={2}
                    >
                      <FormControl isInvalid={errors.time}>
                        <div className="row_box">
                          <FormLabel mb={5} className="label" htmlFor="time">
                            게임시간
                          </FormLabel>
                          <Slider
                            aria-label="slider-ex-4"
                            defaultValue={sliderValue}
                            min={1}
                            mb={10}
                            max={5}
                            colorScheme="teal"
                            onChange={(v) => setSliderValue(v)}
                          >
                            <SliderMark value={1} mt="4" ml="-3" fontSize="sm">
                              1min
                            </SliderMark>
                            <SliderMark value={2} mt="4" ml="-3" fontSize="sm">
                              2min
                            </SliderMark>
                            <SliderMark value={3} mt="4" ml="-3" fontSize="sm">
                              3min
                            </SliderMark>
                            <SliderMark value={4} mt="4" ml="-3" fontSize="sm">
                              4min
                            </SliderMark>
                            <SliderMark value={5} mt="4" ml="-3" fontSize="sm">
                              5min
                            </SliderMark>
                            <SliderTrack bg="blue.100">
                              <SliderFilledTrack bg="blue.600" />
                            </SliderTrack>
                            <SliderThumb boxSize={6}>
                              <Box color="blue.600" as={GiSandsOfTime} />
                            </SliderThumb>
                          </Slider>
                        </div>
                        <FormErrorMessage>
                          {errors.time && errors.time.message}
                        </FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={errors.type}>
                        <RadioGroup
                          defaultValue={typeState}
                          mb={5}
                          onChange={onTypeChange}
                          value={typeState}
                        >
                          <Stack spacing="20px" direction="row">
                            <Radio value="1">한글</Radio>
                            <Radio value="2">영어</Radio>
                          </Stack>
                        </RadioGroup>
                        <FormErrorMessage>
                          {errors.type && errors.type.message}
                        </FormErrorMessage>
                      </FormControl>

                      <Button onClick={onPlayGame}>게임시작</Button>
                    </Flex>
                  </form>
                ) : roomData.writer === userInfo?.uid && gameState === 2 ? (
                  <>
                    <Flex
                      width="100%"
                      minHeight="50vh"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Button onClick={gameInit}>재경기 하기</Button>
                    </Flex>
                  </>
                ) : (
                  <div className="game_box">대기중</div>
                )}
              </>
            )}
          </Flex>
        </>
      )}
    </PlayBox>
  );
}
