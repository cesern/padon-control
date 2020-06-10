var formulario;

// elimina todas las filas de la tabla, menos la principal
function removeOption(id){
    $('#'+id).children('option').remove();
};

function addOptions(id, options){
    $("#"+id).append('<option selected>Todos</option>');
    options.forEach(option => {
        $("#"+id).append('<option>'+option.name+'</option>');
    });
}

function setTodo(id){
    removeOption(id)
    $("#"+id).append('<option selected>Todos</option>');
}

// obtener la division
function getDivision() {
    $.ajax({
        url: '/p/get/division/',
        type: 'POST',
        data: formulario.serialize(),
        success : function(data) {
            // remove options
            removeOption('forDivision')
            removeOption('forDelegation')
            // add options
            addOptions('forDivision', data.divisions)
            setTodo('forDelegation')
        }
    });
}
// obtener la delegacion
function getDelegation() {
    $.ajax({
        url: '/p/get/delegation/',
        type: 'POST',
        data: formulario.serialize(),
        success : function(data) {
            // remove options
            removeOption('forDelegation')
            // add options
            addOptions('forDelegation', data.delegations)
        }
    });
}

$(function(){ 
    formulario = $('#formAdvanced');
    
    $("select[name=unit_name]").change(function(){
        var select = $( "#forAcademicUnit option:selected" ).text()
        if (select !== 'Todos'){
            getDivision()
        }else{
            setTodo('forDivision')
            setTodo('forDelegation')
        }   
    });

    $("select[name=division_name]").change(function(){
        var select = $( "#forAcademicUnit option:selected" ).text()
        if (select !== 'Todos'){
            getDelegation()
        }else{
            setTodo('forDelegation')
        }
    });

});