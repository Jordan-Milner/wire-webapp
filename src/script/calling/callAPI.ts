/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

import {SDPMapper} from './SDPMapper';

enum CALL_MESSAGE_TYPE {
  CANCEL = 'CANCEL',
  GROUP_CHECK = 'GROUPCHECK',
  GROUP_LEAVE = 'GROUPLEAVE',
  GROUP_SETUP = 'GROUPSETUP',
  GROUP_START = 'GROUPSTART',
  HANGUP = 'HANGUP',
  PROP_SYNC = 'PROPSYNC',
  REJECT = 'REJECT',
  SETUP = 'SETUP',
  UPDATE = 'UPDATE',
}

export enum CALL_TYPE {
  NORMAL = 0,
  VIDEO = 1,
  FORCED_AUDIO = 2,
}

export enum CONVERSATION_TYPE {
  ONEONONE = 0,
  GROUP = 1,
  CONFERENCE = 2,
}

export enum CALL_STATE {
  NONE = 0 /* There is no call */,
  OUTGOING = 1 /* Outgoing call is pending */,
  INCOMING = 2 /* Incoming call is pending */,
  ANSWERED = 3 /* Call has been answered, but no media */,
  MEDIA_ESTAB = 4 /* Call has been answered, with media */,
  TERM_LOCAL = 6 /* Call was locally terminated */,
  TERM_REMOTE = 7 /* Call was remotely terminated */,
  UNKNOWN = 8 /* Unknown */,
}

interface WCallCallbacks {
  sendMessage: (
    context: any,
    conversationId: string,
    userId: string,
    clientId: string,
    destUserId: string | undefined,
    destUserClient: string | undefined,
    data: string,
    size: number
  ) => number;
  requestConfig: () => number;
}

class WCall {
  conversationId: string;
  state: CALL_STATE;
  callType: CALL_TYPE;
  conversationType: CONVERSATION_TYPE;
  audioCbr: boolean;

  constructor(callType: CALL_TYPE, conversationId: string, conversationType: CONVERSATION_TYPE, audioCbr: boolean) {
    this.conversationId = conversationId;
    this.conversationType = conversationType;
    this.callType = callType;
    this.audioCbr = audioCbr;
  }
}

class WUser {
  userId: string;
  clientId: string;
  callbacks: WCallCallbacks;
  constructor(userId: string, clientId: string, callbacks: WCallCallbacks) {
    this.userId = userId;
    this.clientId = clientId;
    this.callbacks = callbacks;
  }
}

interface ActiveCalls {
  [callId: string]: WCall;
}

interface CallState {
  callConfig: any;
  activeCalls: ActiveCalls;
}
const state: CallState = {
  callConfig: {},
  activeCalls: {},
};

export function callCreate(userId: string, clientId: string, callbacks: WCallCallbacks): WUser {
  const wUser = new WUser(userId, clientId, callbacks);
  wUser.callbacks.requestConfig();
  return wUser;
}

// statefull (will add a call to the list of ongoing calls)
export function callStart(
  wUser: WUser,
  conversationId: string,
  callType: CALL_TYPE,
  conversationType: CONVERSATION_TYPE,
  audioCbr: boolean
): boolean {
  const callIdentifier = generateCallId(wUser, conversationId);
  const activeCall = state.activeCalls[callIdentifier];
  if (activeCall) {
    //Do Stuff
  }
  const wCall = new WCall(callType, conversationId, conversationType, audioCbr);
  wCall.state = CALL_STATE.OUTGOING;

  // add the call to the state
  state.activeCalls[callIdentifier] = wCall;

  const peerConnection = initPeerConnection();

  navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
    stream.getTracks().forEach(function(track) {
      peerConnection.addTrack(track, stream);
    });
    peerConnection
      .createOffer({iceRestart: false, voiceActivityDetection: true})
      .then((sessionDescription: RTCSessionDescription) => {
        peerConnection.setLocalDescription(sessionDescription);
        window.setTimeout(() => {
          const transformedSdp = SDPMapper.rewriteSdp(peerConnection.localDescription, {
            isGroup: false,
            isIceRestart: false,
            isLocalSdp: true,
          });
          const message = buildMessagePayload(CALL_MESSAGE_TYPE.SETUP, 'felix', transformedSdp.sdp.sdp, false);
          wUser.callbacks.sendMessage(
            'felix',
            conversationId,
            wUser.userId,
            wUser.clientId,
            undefined,
            undefined,
            message,
            0
          );
        }, 500);
      });
  });
  return true;
}

export function callConfigUpdate(config: any) {
  state.callConfig = config;
}

function initPeerConnection(): RTCPeerConnection {
  const peerConnection = new window.RTCPeerConnection(state.callConfig);

  peerConnection.createDataChannel('calling-3.0', {ordered: true});

  peerConnection.onaddstream = console.log.bind(console, 'felix onaddstream ');
  peerConnection.ontrack = console.log.bind(console, 'felix ontrack ');
  peerConnection.ondatachannel = console.log.bind(console, 'felix ondatachannel ');
  peerConnection.onicecandidate = console.log.bind(console, 'felix onicecandidate ');
  peerConnection.oniceconnectionstatechange = console.log.bind(console, 'felix oniceconnectionstatechange ');
  peerConnection.onremovestream = console.log.bind(console, 'felix onremovestream ');
  peerConnection.onsignalingstatechange = console.log.bind(console, 'felix onsignalingstatechange ');

  return peerConnection;
}

export function callGetState(wUser: WUser, conversationId: string): CALL_STATE {
  const callIdentifier = generateCallId(wUser, conversationId);
  const foundCall = state.activeCalls[callIdentifier];
  return foundCall ? foundCall.state : CALL_STATE.UNKNOWN;
}

function generateCallId(call: WUser, conversationId: string) {
  return call.userId + call.clientId + conversationId;
}

function buildMessagePayload(type: CALL_MESSAGE_TYPE, sessid: string, sdp: string, isReponse: boolean): string {
  return JSON.stringify({
    resp: isReponse,
    type,
    version: '3.0',
    props: {audiosend: 'true', screensend: 'false', videosend: 'false'},
    sdp,
    sessid,
  });
}
