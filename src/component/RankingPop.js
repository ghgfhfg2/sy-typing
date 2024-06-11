import React, { useEffect, useState } from "react";
import { CommonPopup } from "@component/CommonStyled";
import {
  Box,
  Button,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import { db } from "../firebase";
import { useSelector } from "react-redux";
import { get, onValue, query, ref } from "firebase/database";
import { gameMode } from "../constans";
import styled from "styled-components";
import { IoIosClose } from "react-icons/io";
import { RiVipCrownLine } from "react-icons/ri";
const RankBox = styled.div`
  display: flex;
  flex-direction: column;
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    padding: 0 0.5rem 0 1rem;
  }
  .ranking-list-container {
    margin-top: 1rem;
    padding: 0.5rem;
  }
  .time-tab {
    display: flex;
    gap: 5px;
    align-items: center;
    li {
      cursor: pointer;
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      border-radius: 5px;
      &.on {
        background: #222;
        color: #fff;
        border-color: #222;
      }
    }
  }
  .result-ranking-list {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    li {
      display: flex;
      &.header {
        background: #eee;
        padding: 10px 0;
        border-radius: 5px;
        margin-bottom: 10px;
      }
      span {
        flex: 1;
        display: flex;
        justify-content: center;
      }
      span.num {
        flex: 0 80px;
      }
    }
  }
`;
function RankingPop({ closeRankPop }) {
  const userInfo = useSelector((state) => state.user.currentUser);
  const rRef = query(ref(db, `ranking`));

  const [rankingTotal, setRankingTotal] = useState();
  useEffect(() => {
    const selRef = query(ref(db, `/ranking`));
    get(selRef).then((data) => {
      setRankingTotal(data.val());
    });
  }, []);

  const [rankingData, setRankingData] = useState();
  const [selectMode, setSelectMode] = useState(gameMode[0].name);
  const [selectTime, setSelectTime] = useState("time_1");
  const getRanking = (mode, time) => {
    setSelectMode(mode);
    if (rankingTotal) {
      setRankingData(rankingTotal[mode][time]);
    }
  };
  const getTimeRank = (time) => {
    setSelectTime(time);
  };
  useEffect(() => {
    getRanking(selectMode, selectTime);
  }, [rankingTotal, selectMode, selectTime]);

  return (
    <CommonPopup>
      <div className="con_box">
        <RankBox>
          <header>
            Ranking
            <Button onClick={closeRankPop}>
              <IoIosClose />
            </Button>
          </header>
          <main>
            <div className="mode-tab">
              <Tabs>
                <TabList>
                  {gameMode &&
                    gameMode.map((el, idx) => (
                      <Tab
                        onClick={() => getRanking(el.name, selectTime)}
                        key={idx}
                      >
                        {el.txt}
                      </Tab>
                    ))}
                </TabList>
              </Tabs>
              <div className="ranking-list-container">
                <ul className="time-tab">
                  <li
                    className={selectTime === "time_1" && "on"}
                    onClick={() => getTimeRank("time_1")}
                  >
                    1분
                  </li>
                  <li
                    className={selectTime === "time_2" && "on"}
                    onClick={() => getTimeRank("time_2")}
                  >
                    2분
                  </li>
                  <li
                    className={selectTime === "time_3" && "on"}
                    onClick={() => getTimeRank("time_3")}
                  >
                    3분
                  </li>
                  <li
                    className={selectTime === "time_4" && "on"}
                    onClick={() => getTimeRank("time_4")}
                  >
                    4분
                  </li>
                  <li
                    className={selectTime === "time_5" && "on"}
                    onClick={() => getTimeRank("time_5")}
                  >
                    5분
                  </li>
                </ul>
                <ul className="result-ranking-list">
                  <li className="header">
                    <span className="num">순위</span>
                    <span className="nick">닉네임</span>
                    <span className="score">점수</span>
                  </li>
                  {rankingData &&
                    rankingData.map((el, idx) => (
                      <li key={idx} className={idx == 0 && "winner"}>
                        <span className="num">
                          {idx == 0 ? <RiVipCrownLine /> : idx + 1}
                        </span>
                        <span className="nick">{el.nick}</span>
                        <span className="score">{el.score}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </main>
        </RankBox>
      </div>
    </CommonPopup>
  );
}

export default RankingPop;
