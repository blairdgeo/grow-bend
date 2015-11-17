

function loadPage()
{
      loadMap();
      $('#map3D').css('display', 'none');

}
function  changeView(target){
        $('#TwoControl').removeClass('active');
        $('#ThreeControl').removeClass('active');
        $('#' + target).addClass('active');
        if(target==='TwoControl')
        {
      		$('#map3D').css('display', 'none');
      		$('#map2D').css('display', 'block');
      		$('#map3D').html("");
      		map.invalidateSize();
        }
        else if(target==='ThreeControl')
        {
      		$('#map2D').css('display', 'none');
      		$('#map3D').css('display', 'block');
          $('#map3D').html("");
          var extent = map.getBounds();
          var width = window.innerWidth;
          var height = window.innerHeight;
      		load3D(width, height, extent);
        }
}

