// クエストモード：成功・失敗ルートの管理
// A〜Zの部屋データ（quest-room-data.js）を参照するだけの薄いモジュール。
// 「次にどの部屋へ進めるか」の判断はここへ集約し、quest-mode.js側に
// 部屋データの形状（successRooms／failureRoomの配列の長さなど）を
// 直接知らせないようにする。

import { QUEST_ROOMS_BY_ID } from "./quest-room-data.js";

export function getRoom(roomId) {
  return QUEST_ROOMS_BY_ID[roomId] || null;
}

/**
 * 部屋に、時間切れ・ミス上限のどちらの失敗条件も設定されていないかどうかを判定する。
 * 該当する場合、正解するまで同じ問題へ何度でも再挑戦できる（failureRoomはnull）。
 */
export function hasNoFailureCondition(room) {
  return room.mission.timeLimitMultiplier === null && room.mission.maxIncorrect === null;
}

/**
 * ミッション成功後の進行方法を判定する。
 * @param {object} room
 * @returns {
 *   {type: "choice", roomIds: [string, string]} |
 *   {type: "direct", roomId: string} |
 *   {type: "ending"}
 * }
 */
export function resolveSuccessTransition(room) {
  if (room.stage === 5) {
    return { type: "ending" };
  }
  if (room.stage === 4) {
    return { type: "direct", roomId: room.successRooms[0] };
  }
  return { type: "choice", roomIds: [room.successRooms[0], room.successRooms[1]] };
}

/**
 * ミッション失敗後の進行方法を判定する。
 * @param {object} room
 * @returns {{type: "ending"} | {type: "direct", roomId: string}}
 */
export function resolveFailureTransition(room) {
  if (room.stage === 5) {
    return { type: "ending" };
  }
  return { type: "direct", roomId: room.failureRoom };
}

export function isBossRoom(room) {
  return room.stage === 5;
}
