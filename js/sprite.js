(function () {
  function Sprite(url, pos, size, dSize, color) {
    this.url = url;
    this.pos = pos;
    this.size = size;
    this.dSize = dSize;
    this.color = color;
  }

  Sprite.prototype = {
    render: function (ctx) {
      let x = this.pos[0];
      let y = this.pos[1];

      ctx.drawImage(
        resources.get(this.url),
        x,
        y,
        this.size[0],
        this.size[1],
        0,
        0,
        this.dSize[0],
        this.dSize[1]
      );
    },
  };

  window.Sprite = Sprite;
})();
