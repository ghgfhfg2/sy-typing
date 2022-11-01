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
  background:#fff;
  box-shadow: 0 0 15px rgba(0,0,0,0.2);
  padding: 2rem;
  position:relative;
  border-radius:10px;  
  width:100vw;max-width:1000px;
  margin:0 auto;
  .code_name{width:100%;
    margin-bottom:1rem;
    font-size:1rem;font-weight:600;
    padding-left:1rem;
  }
  .user_list{
    padding:10px;
    padding-right:15px;
    border-right:1px solid #ddd;
    border-radius:5px;
    li{
      display:flex;align-items:center;
      &.header{
        & > span.user{justify-content:center;width:100px;}
      }
      & > span{
        flex-shrink:0;
        padding:0 5px;
        min-width:50px;
        display:flex;justify-content:center;align-items:center;
      }
      &.body{margin-top:10px;
        & > span.user{overflow:hidden;justify-content:flex-start;
          text-overflow:ellipsis;white-space: nowrap;
          display:block;width:100px;
        }
      }
    }
  }
  .game_box{
    width:100%;
    display:flex;
    flex-direction:column;
    height:60vh;
    min-height:300px;
    justify-content:space-between;align-items:center;
    .time_counter{
      padding:1rem;border:2px solid #ddd;
      width:200px;display:flex;justify-content:center;
      font-weight:bold
    }
    .text_box{padding:2rem;box-shadow:0 0 5px rgba(0,0,0,0.25);
      border-radius:7px;border:1px solid #ddd;
      font-size:20px;font-weight:600;
    }
  }
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
          point: data.val().user[key].point || 0,
          speed: data.val().user[key].speed || 0,
          uid: key,
        });
      }
      arr = arr.sort((a,b)=>b.point - a.point);
      obj.user = arr;
      setRoomData(obj);
    });
    if (roomData?.time) {
      setTimeCounter(roomData.time * 60);
      setReadyCounter(3);
    }
    return () => {
      off(rRef);
    };
  }, [roomData?.play]);

  //카운터
  useEffect(() => {
    const rRef = ref(db, `room/${router?.asPath.split("/")[2]}`);
    if (readyCounter > 0) {
      setTimeout(() => {
        setReadyCounter((prev) => prev - 1);
        setTimeTxt(`${readyCounter}초후 시작합니다.`);
      }, 1000);
    }
    if (readyCounter === 0 && timeCounter > 0) {
      setTimeout(() => {
        update(rRef, {
          state: "start",
        });
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
    if(roomData){
      const iRef = ref(db, `room/${roomData.uid}/wordIndex`);
      onValue(iRef, (data) => {
        const index = data.val();
        setShowWord(wordList[index]);
      });
    }
    return () => {
      if(roomData){
        off(ref(db, `room/${roomData.uid}/wordIndex`));
      }
    };
  }, [roomData]);

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
      updates[`room/${roomData.uid}/wordIndex`] = ranIndex;

      const userPath = `room/${roomData.uid}/user/${userInfo.uid}`
      get(ref(db,`${userPath}`))
      .then(data=>{
        const newPoint = data.val().point ? data.val().point + 1 : 1;
        const oldSpeed = data.val().speed || 0;
        const newSpeed = Math.floor((oldSpeed * data.val().point + speed)/newPoint);
        if(oldSpeed){
          update(ref(db,`${userPath}`),{
            speed:newSpeed,
            point:newPoint
          })
        }else{
          update(ref(db,`${userPath}`),{
            speed,
            point:newPoint
          })
        }
      })
      
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
          {roomData.roomName && 
            <div className="code_name">
              방 코드네임 : {roomData.roomName}
            </div>
          }
          <Flex>
          <ul className="user_list">
            <li className="header">
              <span className="rank">순위</span>
              <span className="user">유저</span>
              <span className="point">점수</span>
              <span className="speed">평균타수</span>
            </li>
            {roomData.user.map((el, idx) => (
              <li className="body" key={el.uid}>
                <span className="rank">{idx+1}</span>
                <span className="user">{el.nick}</span>
                <span className="point">{el.point}</span>
                <span className="speed">{el.speed}</span>
              </li>
            ))}
          </ul>
          {roomData.play ? (
            <div className="game_box">
              <div className="time_counter">{timeTxt}</div>
              {roomData.state === "start" && (
                <div className="text_box">{showWord}</div>
              )}
              <form
                onSubmit={handleSubmit(onSubmit)}
              >
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
              {roomData.writer === userInfo?.uid ? (
                <form className="game_box"
                    onSubmit={handleSubmit(onSubmit)}
                  >
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
                  </form>
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
