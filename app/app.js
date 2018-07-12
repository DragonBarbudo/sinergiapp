new Vue({
  el: '#app',
  components: {Swatches: window.VueSwatches.default},
  data: () => ({
    dialog: false,

    material: {
      w: 122,
      h: 244,

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
    piezasExpansionPanel : [],
    piezas: [
      {w:40, h:40, q:11, c:"#C0382B"}
    ],

    blocks: [],
    graficos:[],
    paginas : [{}]

  }),
  methods: {
    downloadPDF : function(){
      this.dialog=true;
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
    }
  },
  computed : {
   viewboxSize: function(){
     return "0,"+"0,"+this.material.w+","+this.material.h;
   },


   visualizer : function(){

     var pageCount = 0;
     var temporals = [];


     //CREATE PAGE 1
     this.paginas = [
       { graphics: [] }
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
        var packer = new Packer(this.material.w, this.material.h);
        //Sort each block > biggest to smallest
        this.blocks = this.blocks.sort(function(a,b) { return (b.w*b.h < a.w*a.h ); });
        //Sort inside the packer area
        packer.fit(this.blocks);

        //Fit in area? Store each block in the page where it Fit
        //Otherwise save this in a new page
        for(var n = 0; n<this.blocks.length; n++){
          var block = this.blocks[n];
          if(block.fit){ //FITS

            var theGraphic = { y:block.fit.y, x:block.fit.x, w:block.w, h:block.h, c:block.c };
            this.paginas[pageCount].graphics.push( theGraphic );
            this.graficos.push( theGraphic );
          }
          else { //DOESNT FITS... new page
            var theGraphic = { w:block.w, h:block.h, c:block.c };
            temporals.push(theGraphic);

          }
        }
        if(temporals.length>0){
          this.blocks = temporals;
          this.paginas[pageCount+1] = {
            graphics: []
          }
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
