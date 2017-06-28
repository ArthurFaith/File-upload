;(function ($, window, document, undefined) {
	//弹窗插件
	var Popup = function(options){
		this.defaults = {
			title: '提示',
			content: '',
			ok: function() {}
		},
		this.options = $.extend({}, this.defaults, options);
	}
	
	Popup.prototype = {
		getModal:function(){
			var html = [];
			var data = this.options;
			html.push('<div class="modal fade" id="uploadTip" tabindex="-1" role="dialog" aria-labelledby="gridSystemModalLabel">');
			html.push('<div class="modal-dialog" role="document" style="width: 300px;">');
			html.push('<div class="modal-content">');
			html.push('<div class="modal-header">')
			html.push('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>')
			html.push('<h4 class="modal-title" id="gridSystemModalLabel">'+data.title+'</h4>')
			html.push('</div>')
			html.push('<div class="modal-body">')
			html.push('<span>' + data.content + '</span>')
			html.push('</div>')
			html.push('<div class="modal-footer">')
			html.push('<a class="btn btn-primary" data-dismiss="modal" id="modalYes">确认</a>')
			html.push('</div></div></div></div>')
		
			return html.join('');
		},
		addModal:function(){
			var that = this;
			$("body #uploadTip").remove();
			var htmlDom = this.getModal();
			$("body").append(htmlDom);
			$('body #uploadTip').modal('show');
			$("#modalYes").on('click',function(){
				that.options.ok();
			})
		}
		
	}
	
	$.showModal = function(options){
		var modal = new Popup(options);
		modal.addModal();
	}
	
	//文件加载
	window.fileList = [];//文件列表
	var FileLoad = function($ele,options){
		this.$ele = $ele;
		this.defaults = {
			maxSize:'',//最大文件大小
		};
		this.options = $.extend({}, this.defaults, options);
	}
	
	FileLoad.prototype = {
		addFile : function(obj){
			var html = [];
			html.push('<tr>');
			html.push('<td><strong>' + obj.name + '</strong></td>');
			html.push('<td nowrap>' + obj.size + '</td>');
			html.push('<td>' +
				'<div class="progress">'+
				'<div class="progress-bar" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 0%;">'+
				'</div></div>'+
				'</td>');
			html.push('<td class="text-center"></td>');
			html.push('<td nowrap><button type="button" class="btn btn-default btn-xs onlyUpload">上传</button>');
			//	html.push('<button type="button" class="btn btn-default btn-xs">预览</button>');
			html.push('<button type="button" class="btn btn-default btn-xs removeFile">移除</button></td></tr>');
			return html.join('')
		},
		viewFile : function(){			
			var fileType = ['doc', 'docx', 'xls', 'xlsx', 'pdf', 'jpg', 'png', 'ppt', 'pptx', 'txt', 'zip'], //文件类型限制
			//文件类型限制
				type = this.$ele.value.split('.').pop(),
				that = this;
			if(fileType.indexOf(type.toLocaleLowerCase()) == -1) {
				$.showModal({
					title: '提示',
					content: '暂不支持该类型的文件，请重新选择!',
					ok: function() {}
				});
				return;
			}
			//限制文件大小
			if(this.options.maxSize && this.$ele.files[0].size > this.options.maxSize * 1024 * 1024) {
				$.showModal({
					title: '提示',
					content: '请上传小于' + this.options.maxSize + 'M的文件',
					ok: function() {}
				});
				return;
			}
			
			if(window.fileList.length>8)
			{
				$.showModal({
					title: '提示',
					content: '一次不能传超过9个附件！',
					ok: function() {}
				});
				return;
			}
			
			for(var j = 0; j < that.$ele.files.length; j++) {
				window.fileList.push(that.$ele.files[j]);
				var oneList = that.addFile({
					name: that.$ele.files[j].name,
					size: $.sizeExplain(that.$ele.files[j].size)
				});
				renderHtml(oneList);
			}
			
			
			function renderHtml(oneList){
				$(".uploadList table tbody").append(oneList);
				//上传事件
				$('.onlyUpload').unbind('click');
				$(".onlyUpload").on('click',function(){
					$.upLoad_file(this,{
						type:'one',//all:全部上传；one:单个上传
						url:'upload.php',
						callback:function(data){},
						uploading:function(){}
					})
				})
				//删除事件
				$(".removeFile").unbind('click')
				$(".removeFile").on('click',function(){
					$.removeFiles(this);
				})
			}
			
		}
	}
	
	//文件大小转换
	$.sizeExplain = function(size) {
		if(size<1024){
			return parseFloat(size) + 'B';
		}
		if(size>1023&&size<1024*1024){
			var a = size / 1024;
			return parseFloat(a.toFixed(2)) + 'KB';
		}
		if(size>1024*1023){
			var b = size / (1024*1024);
			return parseFloat(b.toFixed(2)) + 'M';
		}
		
	}

	$.previewFile = function($ele){
		var filePre = new FileLoad($ele,{
			maxSize:10,//最大文件大小
		})
		filePre.viewFile();
	}
	
	
	//文件上传
	var UploadFile = function($ele,options){
		this.$ele = $ele,
		this.defaults={
			type:'all',//all:全部上传；one:单个上传
			url:'',
			callback:function(data){},
			uploading:function(){}
		},
		this.options = $.extend({}, this.defaults, options);	
	}
	
	UploadFile.prototype = {
		uploadFile: function(){
			if(!window.fileList[0])
			{
				$.showModal({
					title: '提示',
					content: '请选择文件！',
					ok: function() {}
				});
				return;
			}
			var fd = new FormData(), //表单对象
				xhr = new XMLHttpRequest(), //ajax对象
				that = this,
				fileData = [],
				index = $(".uploadList table tbody tr").index($(that.$ele).parent().parent());
				
			if(that.options.type == 'all'){
				fileData = window.fileList;
				that.options.uploading = function(pre){
					var progress = pre + '%';
					$(".uploadList .progress").show();
					$(".uploadList .progress-bar").css({ 'width': 0 })
					$(".uploadList .progress-bar").css({ 'width': progress });
					$(".uploadList .progress-bar").text(progress);
				}
			}
			else if(that.options.type == 'one'){				
				fileData.push(window.fileList[index]);
				that.options.uploading = function(pre){
					var progress = pre + '%';					
					$(that.$ele).parent().parent().find('.progress').show();
					$(that.$ele).parent().parent().find('.progress-bar').css({ 'width': 0 })
					$(that.$ele).parent().parent().find('.progress-bar').css({ 'width': progress });
					$(that.$ele).parent().parent().find('.progress-bar').text(progress);
				}
			}
			for(var n=0;n<fileData.length;n++)
			{					
				fd.append('file', fileData[n]);
				console.log(fd.get('file'))//文件存入表单对象
				xhr.open('post', that.options.url); //建立ajax请求
				//监听ajax状态
				
				xhr.onreadystatechange = function() {
					if(xhr.readyState == 4) {
						if(xhr.status == 200) {
							//上传成功回调
							if(that.options.callback instanceof Function) {
								$.showModal({
									title: '提示',
									content: '上传成功！',
									ok: function() {}
								});
								
								window.fileList.splice(index, 1);
								console.log(window.fileList);
								that.options.callback(xhr.responseText);
							}
						}
						else {
							console.log(xhr.status)
							$.showModal({
								title: '提示',
								content: '上传失败，请重新上传！',
								ok: function() {}
							});
						}
					} 
					
				}
				//进度条
				xhr.upload.onprogress = function(event) {
					var pre = Math.floor(100 * event.loaded / event.total);
					
					if(that.options.uploading instanceof Function) {
						that.options.uploading(pre);
					}
					
				}
				xhr.send(fd);
			}
			
		}
	}
	
	$.upLoad_file = function($ele,options){
		var objUpload = new UploadFile($ele,options);
		objUpload.uploadFile();		
	}

	//移除
	$.removeFiles = function($ele){
		if(arguments[0])
		{
			var index = $(".uploadList table tbody tr").index($($ele).parent().parent());
			window.fileList.splice(index, 1);
			$(".uploadList table tbody tr").eq(index).remove();
		}
		else
		{
			window.fileList.splice(0, window.fileList.length);
			$(".uploadList table tbody").empty();
		}
	}

























})(jQuery, window, document);