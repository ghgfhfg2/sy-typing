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
} from "firebase/database";
import { wordList } from "./db";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Spinner,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { useRouter } from "next/router";
const PlayBox = styled.div`
  padding: 0 1rem;
  height: calc(100vh - 60px);
`;

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
          uid: key,
        });
      }
      obj.user = arr;
      setRoomData(obj);
    });
    if (roomData?.time) {
      setTimeCounter(roomData.time * 3);
      setReadyCounter(3);
    }
    return () => {
      off(rRef);
    };
  }, [roomData?.play]);

  //카운터
  useEffect(() => {
    if (readyCounter > 0) {
      setTimeout(() => {
        setReadyCounter((prev) => prev - 1);
        setTimeTxt(`${readyCounter}초후 시작합니다.`);
      }, 1000);
    }
    if (readyCounter === 0 && timeCounter > 0) {
      setTimeout(() => {
        setTimeCounter((prev) => prev - 1);
        setTimeTxt(timeCounter);
      }, 1000);
    }
    if (timeCounter === 0) {
      setTimeout(() => {
        setTimeTxt("end");
      }, 1000);
    }
  }, [timeCounter, readyCounter]);

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

  if (roomData && userInfo && roomData.writer !== userInfo.uid) {
    const onRef = onDisconnect(
      ref(db, `room/${roomData.uid}/user/${userInfo.uid}`)
    );
    onRef.remove();
  }

  const [showWord, setShowWord] = useState("");
  const [wordLeng, setWordLeng] = useState(0);
  useEffect(() => {
    get(ref(db, `wordLength`)).then((data) => {
      setWordLeng(data.val());
    });

    const iRef = ref(db, `wordIndex`);
    onValue(iRef, (data) => {
      const index = data.val();
      get(ref(db, `words/${index}`)).then((data) => {
        setShowWord(data.val());
      });
    });
    return () => {
      off(iRef);
    };
  }, []);

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

  const onPlayGame = () => {
    const ranIndex = Math.floor(Math.random() * wordLeng) + 1;
    update(ref(db, `room/${roomData.uid}`), {
      play: true,
      time: sliderValue,
      wordIndex: ranIndex,
    });
  };

  const onSubmit = (e) => {
    const answer = e.answer;
    if (answer === showWord) {
      const lastTime = new Date().getTime();
      const distanceTime = lastTime - timer;
      const calcNum = Math.floor(60000 / distanceTime);
      const speed = calcNum * count;
      const ranIndex = Math.floor(Math.random() * wordLeng) + 1;
      const updates = {};
      updates[`wordIndex`] = ranIndex;
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
    }
  };

  return (
    <>
      {roomData && (
        <PlayBox>
          {roomData.roomName && <Flex>방 코드네임 : {roomData.roomName}</Flex>}
          <ul className="user_list">
            {roomData.user.map((el, idx) => (
              <li key={idx}>{el.nick}</li>
            ))}
          </ul>
          {roomData.play ? (
            <>
              <div className="time_counter">{timeTxt}</div>
              <div className="text_box">{showWord}</div>
              <form
                style={{ width: "100%", paddingTop: "20vh" }}
                onSubmit={handleSubmit(onSubmit)}
              >
                <Flex>
                  <Input
                    onInput={onTyping}
                    type="text"
                    {...register("answer")}
                    disabled={timeCounter === 0 ? true : false}
                  />
                </Flex>
              </form>
            </>
          ) : (
            <>
              {roomData.writer === userInfo?.uid ? (
                <>
                  <form
                    style={{ width: "100%", paddingTop: "20vh" }}
                    onSubmit={handleSubmit(onSubmit)}
                  >
                    <Flex justifyContent="center" marginTop={10}>
                      <Flex
                        maxWidth={400}
                        width="100%"
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
                              <SliderMark
                                value={1}
                                mt="4"
                                ml="-3"
                                fontSize="sm"
                              >
                                1min
                              </SliderMark>
                              <SliderMark
                                value={2}
                                mt="4"
                                ml="-3"
                                fontSize="sm"
                              >
                                2min
                              </SliderMark>
                              <SliderMark
                                value={3}
                                mt="4"
                                ml="-3"
                                fontSize="sm"
                              >
                                3min
                              </SliderMark>
                              <SliderMark
                                value={4}
                                mt="4"
                                ml="-3"
                                fontSize="sm"
                              >
                                4min
                              </SliderMark>
                              <SliderMark
                                value={5}
                                mt="4"
                                ml="-3"
                                fontSize="sm"
                              >
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
                        <Button onClick={onPlayGame}>게임시작</Button>
                      </Flex>
                    </Flex>
                  </form>
                </>
              ) : (
                <>대기중</>
              )}
            </>
          )}
        </PlayBox>
      )}
    </>
  );
}
