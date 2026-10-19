// F1 賽車場、大獎賽共用的開車手感。
// 鍵盤：↑／W 油門、↓／S 煞車（停住再按就倒車）、←／→ 讓車頭往車子自己的左右轉（跟一般賽車遊戲一樣；倒車時方向盤會反過來，跟真的車一樣）。
// 搖桿（手機）：指哪個方向，車頭就轉過去開；往車尾方向推先煞車、停住再推就倒車。
// 只改 angle、speed；賽道外減速、移動、碰撞交給各張地圖。

export interface DrivenCar {
  angle: number;
  speed: number;
}

const REVERSE_TOP = 5;

export function steerCar(car: DrivenCar, dt: number, keys: ReadonlySet<string>, stick: { x: number; y: number }, top: number): void {
  const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
  const gas = keys.has('up');
  const brake = keys.has('down');
  const steer = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
  if (gas || brake || steer !== 0) {
    if (gas && !brake) {
      if (car.speed < -0.2) car.speed += Math.min(-car.speed, dt * 14);
      else car.speed += (top - car.speed) * Math.min(1, dt * 1.6);
    } else if (brake && !gas) {
      if (car.speed > 0.6) car.speed -= Math.min(car.speed, dt * 14);
      else car.speed += (-REVERSE_TOP - car.speed) * Math.min(1, dt * 1.8);
    } else {
      car.speed -= car.speed * Math.min(1, dt * 1.2);
    }
    // 停著也能慢慢轉一點（卡在牆邊才轉得出來）；越快越靈敏，倒車時方向反過來
    const grip = Math.min(1, Math.abs(car.speed) / 3);
    const dir = car.speed < -0.2 ? -1 : 1;
    car.angle = wrap(car.angle + steer * dir * dt * (0.9 + 2.3 * grip));
    return;
  }
  if (stick.x !== 0 || stick.y !== 0) {
    const target = Math.atan2(stick.y, stick.x);
    const diff = wrap(target - car.angle);
    const backward = Math.abs(diff) > 2.4;
    if (backward && car.speed > 0.6) {
      // 往車尾方向推：先煞車
      car.speed -= Math.min(car.speed, dt * 14);
    } else if (backward) {
      // 停住之後繼續往車尾推＝倒車：車頭不轉過去，車尾對準推的方向
      const back = wrap(target + Math.PI - car.angle);
      car.angle += Math.sign(back) * Math.min(Math.abs(back), dt * 2.2);
      car.speed += (-REVERSE_TOP - car.speed) * Math.min(1, dt * 1.8);
    } else if (car.speed < -0.2) {
      // 倒車中改往前推：先煞住再往前開
      car.speed += Math.min(-car.speed, dt * 14);
    } else {
      car.angle += Math.sign(diff) * Math.min(Math.abs(diff), dt * 3.2);
      // 方向差太多先減速轉彎
      const want = Math.abs(diff) > 1.6 ? top * 0.3 : top;
      car.speed += (want - car.speed) * Math.min(1, dt * 1.6);
    }
    return;
  }
  car.speed -= car.speed * Math.min(1, dt * 1.2);
}
