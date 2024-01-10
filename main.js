　import { nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, uuidV4 } from '@skyway-sdk/room';
// ↑ライブラリの取得。これを取るとカメラが映らない

const token = new SkyWayAuthToken({
  jti: uuidV4(),
  iat: nowInSec(),
  exp: nowInSec() + 60 * 60 * 24,
  scope: {
    app: {
      id: 'c0482134-9224-4a5a-bfbf-ac687c8a46af',
      turn: true,
      actions: ['read'],
      channels: [
        {
          id: '*',
          name: '*',
          actions: ['write'],
          members: [
            {
              id: '*',
              name: '*',
              actions: ['write'],
              publication: {
                actions: ['write'],
              },
              subscription: {
                actions: ['write'],
              },
            },
          ],
          sfuBots: [
            {
              actions: ['write'],
              forwardings: [
                {
                  actions: ['write'],
                },
              ],
            },
          ],
        },
      ],
    },
  },
}).encode('TqRzHkdQR3oNYGNOpK/nHZZt9+Fe6yxtwaiVj7JFZeA=');

(async () => {
  // 1
  const localVideo = document.getElementById('local-video');
  const buttonArea = document.getElementById('button-area');
  const remoteMediaArea = document.getElementById('remote-media-area');
  const roomNameInput = document.getElementById('room-name');
  
  const myId = document.getElementById('my-id');
  const joinButton = document.getElementById('join');
  
  const { audio, video } = await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream(); // 2

  video.attach(localVideo); // 3
  await localVideo.play(); // 4

  joinButton.onclick = async () => {
    if (roomNameInput.value === '') return;
  
    const context = await SkyWayContext.Create(token);
    const room = await SkyWayRoom.FindOrCreate(context, {
      type: 'p2p',
      name: roomNameInput.value,
    });
    const me = await room.join();

    myId.textContent = me.id;

    await me.publish(audio);
    await me.publish(video);

    const subscribeAndAttach = (publication) => {
      // 3
      if (publication.publisher.id === me.id) return;
    
      const subscribeButton = document.createElement('button'); // 3-1
      subscribeButton.textContent = `${publication.publisher.id}: ${publication.contentType}`;
    
      buttonArea.appendChild(subscribeButton);
    
      subscribeButton.onclick = async () => {
        // 3-2
        const { stream } = await me.subscribe(publication.id); // 3-2-1
    
        let newMedia; // 3-2-2
        switch (stream.track.kind) {
          case 'video':
            newMedia = document.createElement('video');
            newMedia.playsInline = true;
            newMedia.autoplay = true;
            break;
          case 'audio':
            newMedia = document.createElement('audio');
            newMedia.controls = true;
            newMedia.autoplay = true;
            break;
          default:
            return;
        }

        stream.attach(newMedia); // 3-2-3
        remoteMediaArea.appendChild(newMedia);
      };
    };
    
    room.publications.forEach(subscribeAndAttach); // 1
    room.onStreamPublished.add((e) => {
      // 2
      subscribeAndAttach(e.publication);
    });
  };

})(); // 1