var app = new Vue({
  el: '#app',
  components: {Swatches: window.VueSwatches.default},
  data: () => ({
    drawer: true,
    dialog: false,
    changelog: true,
    activePage: 0,
    db: configurations,
    material: {
      w: 320,
      h: 100,
      w_rendered: 0,
      h_rendered: 0,
      tipo: 'flexible',
      rigidoElegido : { id: 0, w:122, h:244 },
      flexibleElegido : {id:0, w: 320, t: 'Lona Front'},
      hFlexible: 100,
      rebase: false,
      rebaseTipo: 0,
      rebases: { t:0, r:0, b:0, l:0, tb:0, lr:0},
      margen: false,
      medianil: {name: "0 mm", value:0.0},
      pinza: true
    },
    piezasExpansionPanel : [],
    piezas: [
      {w:60, h:30, q:11, c:"#C0382B"}
    ],
    blocks: [],
    graficos:[],
    paginas : [{}]
  }),
  methods: {
    downloadPDF : function(){
      this.dialog=true;
      return false;
      var pdf = new jsPDF('l', 'cm', [this.material.w, this.material.h]);
      svg2pdf(document.getElementById('svg'), pdf, {
        xOffset: 0,
        yOffset: 0,
        scale: 1
      });
      pdf.save('sinergia.pdf');
    },
    addGraphic : function(){
      this.piezas.push({w:10, h:10, q:1, c:"#000" });
    },
    deleteGraphic : function(index){
      this.piezas.splice(index, 1);
      this.piezasExpansionPanel = []
    },
    rotateGraphic : function(index, w, h){
      this.piezas[index].w = h;
      this.piezas[index].h = w;
    },
    fillout : function(index){
      var currentPages = this.paginas.length;

      this.filling = setInterval(function(){
        if(this.paginas.length > currentPages){
          clearInterval(this.filling);
          this.piezas[index].q--;
        } else {
          this.piezas[index].q++;
        }
      }.bind(this), 10);
    },
    materialSize: function(value){

      if(this.material.tipo=='flexible'){
        this.material.w = this.material.flexibleElegido.w;
        this.material.h = this.material.hFlexible;
      }

      if(this.material.tipo=='rigido'){
        this.material.w = this.material.rigidoElegido.w;
        this.material.h = this.material.rigidoElegido.h;
      }



    }

  },
  computed : {
   viewboxSize: function(){
     return "0,"+"0,"+this.material.w+","+this.material.h;
   },


   visualizer : function(){
     this.activePage=0;

     this.material.w_rendered = this.material.w;
     this.material.h_rendered = this.material.h;

     if(this.material.tipo=='flexible'){

       if(this.material.pinza){
         this.material.w_rendered = this.material.w - 3;
         this.material.h_rendered = this.material.h - 3;

       }
     } else if(this.material.tipo=='rigido'){
       //Margen para corte

       if(this.material.margen){
         this.material.w_rendered = this.material.w - 2;
         this.material.h_rendered = this.material.h - 2;
       }
       //Medianil
     }




     //Rebase perimetral
/*
      this.material.w_rendered = this.material.w - this.material.rebases.l - this.material.rebases.r;
      this.material.h_rendered = this.material.h - this.material.rebases.t - this.material.rebases.b;
*/







     var pageCount = 0;
     var temporals = [];

     //CREATE PAGE 1
     this.paginas = [
       { graphics: [], ocupado:0 }
     ]

     //Reseting Blocks packer: Array 1
     this.blocks = [];
     //Cleaning full graphics per page: Array 2
     this.graficos = [];

     //Convert pieces to individual graphics and store'em in blocks
     for(var p = 0; p<this.piezas.length; p++){
       for(var pi = 0; pi<this.piezas[p].q; pi++){
         this.blocks.push( { w: this.piezas[p].w*1, h:this.piezas[p].h*1, c: this.piezas[p].c, } );
       }
     }


     //FOR of PAGES
     var endVizualizer = false;
     while(!endVizualizer){

        //Define packer container
        var packer = new Packer(this.material.w_rendered, this.material.h_rendered);
        //Sort each block > biggest to smallest
        this.blocks = this.blocks.sort(function(a,b) { return (b.h < a.h); });
        //Sort inside the packer area
        packer.fit(this.blocks);

        //Fit in area? Store each block in the page where it Fit
        //Otherwise save this in a new page
        for(var n = 0; n<this.blocks.length; n++){
          var block = this.blocks[n];
          if(block.fit){ //FITS
            var theGraphic;
            if(this.material.margen && this.material.tipo=='rigido'){
              theGraphic = { y:block.fit.y+1, x:block.fit.x+1, w:block.w, h:block.h, c:block.c };
            } else if(this.material.pinza && this.material.tipo=='flexible'){
              theGraphic = { y:block.fit.y+1.5, x:block.fit.x+1.5, w:block.w, h:block.h, c:block.c };
            } else {
              theGraphic = { y:block.fit.y, x:block.fit.x, w:block.w, h:block.h, c:block.c };
            }
            this.paginas[pageCount].graphics.push( theGraphic );
            this.graficos.push( theGraphic );
            this.paginas[pageCount].ocupado+= block.w * block.h;
          }
          else { //DOESNT FITS... new page
            var theGraphic = { w:block.w, h:block.h, c:block.c };
            temporals.push(theGraphic);

          }
        }


        if(temporals.length>0 && this.paginas[pageCount].graphics.length>0 && pageCount<40){
          this.blocks = temporals;
          this.paginas[pageCount+1] = { graphics: [], ocupado:0 }
          temporals = [];
          pageCount++;
        } else {
          endVizualizer = true;
        }

      }



   } //ends visualizer


  },
  watch: {
    material: {
        handler(val){

          if(this.material.rebaseTipo==0){
            this.material.rebases.l = 0;
            this.material.rebases.r = 0;
            this.material.rebases.lr = 0;
            this.material.rebases.t = val.rebases.tb;
            this.material.rebases.b = val.rebases.tb;

          }
          if(this.material.rebaseTipo==1){
            this.material.rebases.t = 0;
            this.material.rebases.b = 0;
            this.material.rebases.tb = 0;

            this.material.rebases.l = val.rebases.lr;
            this.material.rebases.r = val.rebases.lr;
          }

      },
      deep:true
    }
  }
})



app.materialSize();
