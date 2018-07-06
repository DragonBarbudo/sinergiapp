Packer = function(w, h) {
  this.init(w, h);
};

Packer.prototype = {

  init: function(w, h) {
    this.root = { x: 0, y: 0, w: w, h: h };
  },

  fit: function(blocks) {
    var n, node, block;
    for (n = 0; n < blocks.length; n++) {
      block = blocks[n];
      if (node = this.findNode(this.root, block.w, block.h))
        block.fit = this.splitNode(node, block.w, block.h);
    }
  },

  findNode: function(root, w, h) {
    if (root.used)
      return this.findNode(root.right, w, h) || this.findNode(root.down, w, h);
    else if ((w <= root.w) && (h <= root.h))
      return root;
    else
      return null;
  },

  splitNode: function(node, w, h) {
    node.used = true;
    node.down  = { x: node.x,     y: node.y + h, w: node.w,     h: node.h - h };
    node.right = { x: node.x + w, y: node.y,     w: node.w - w, h: h          };
    return node;
  }

}









new Vue({
  el: '#app',
  data: () => ({
    dialog: false,
    graphics : [],
    material: {
      w: 400,
      h: 300,
      tipo: 'flexible',
      rigidoElegido : 0,
      rebase: false,
      rebaseTipo: 1,
      rebases: { t:0, r:0, b:0, l:0},
      margen: false,
      medianil: 0.0,
      medianiles:[
        {name: "0 mm", value:0.0},
        {name:"3 mm", value:0.3},
        {name:"5 mm", value:0.5}
      ],
      medidas:[
        { id: 0, w:122, h:244 },
        { id: 1, w:120, h:180 },
        { id: 2, w:120, h:150 },
        { id: 3, w:120, h:90 },
      ]
    },
    piezas: [
      {w:50, h:50, q:1 }
    ],
    canvas: {
      viewbox: "0,0,400,300",
      width: 400,
      height: 300,
      widthCut: 40,
      heightCut: 60,
      objX:0,
      objY:0
    },

  }),
  methods: {
    downloadPDF : function(){
      this.dialog=true;
      var pdf = new jsPDF('l', 'cm', [this.canvas.width, this.canvas.height]);
      svg2pdf(document.getElementById('svg'), pdf, {
        xOffset: 0,
        yOffset: 0,
        scale: 1
      });
      pdf.save('sinergia.pdf');
    },
    addGraphic : function(){
      this.piezas.push({w:10, h:10, q:1 });
    },
    deleteGraphic : function(index){
      this.piezas.splice(index, 1);
      this.graphics = []
    }
  },
  computed : {

   viewboxSize: function(){
     return "0,"+"0,"+this.material.w+","+this.material.h;
   },
   objectsInX : function(){
     var nvalue = Math.floor(this.canvas.width / this.canvas.widthCut);
     this.canvas.objX = nvalue;
     return nvalue;
   },
   objectsInY : function(){
     var nvalue = Math.floor(this.canvas.height / this.canvas.heightCut);
     this.canvas.objY = nvalue;
     return nvalue;
   },
   objectsTotal : function(){
     return this.canvas.objX * this.canvas.objY;
   }
  },
  watch: {
    material: {
        handler(val){
          if(val.tipo == 'flexible'){

          } else if(val.tipo == 'rigido'){
            this.material.w = this.material.medidas[this.material.rigidoElegido].w;
            this.material.h = this.material.medidas[this.material.rigidoElegido].h;
          }

      },
      deep:true
    }
  }
})


