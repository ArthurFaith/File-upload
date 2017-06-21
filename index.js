var fileList = [];
var getModal = function(content) {
	var html = [];
	html.push('<div class="modal fade" id="uploadTip" tabindex="-1" role="dialog" aria-labelledby="gridSystemModalLabel">');
	html.push('<div class="modal-dialog" role="document" style="width: 300px;">');
	html.push('<div class="modal-content">');
	html.push('<div class="modal-header">')
	html.push('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>')
	html.push('<h4 class="modal-title" id="gridSystemModalLabel">提示</h4>')
	html.push('</div>')
	html.push('<div class="modal-body">')
	html.push('<span>' + content + '</span>')
	html.push('</div>')
	html.push('<div class="modal-footer">')
	html.push('<button type="button" class="btn btn-primary"  data-dismiss="modal">确认</button>')
	html.push('</div></div></div></div>')

	return html.join('');
}
var modalTip = function(option) {
	if(!$('body #uploadTip')[0]) {
		var modal = getHtml(option.content);
		$('body').append(modal);
	}
	$('#uploadTip').modal('show');
}

var getFileList = function(option) {
	var html = [];
	html.push('<tr>');
	html.push('<td><strong>' + option.name + '</strong></td>');
	html.push('<td nowrap>' + option.size + '</td>');
	html.push('<td>' +
		'<div class="progress progress-sm m-b-none m-t-xs" style="display:none">' +
		'<div class="progress-bar bg-info" role="progressbar">' + option.pre + '</div>' +
		'</div>' +
		'</td>');
	html.push('<td class="text-center"></td>');
	html.push('<td nowrap><button id="onlyUpload" type="button" class="btn btn-default btn-xs" onclick="oneUpload(this)">上传</button>');
	//	html.push('<button type="button" class="btn btn-default btn-xs">预览</button>');
	html.push('<button type="button" class="btn btn-default btn-xs" onclick="oneDelete(this)">移除</button></td></tr>');
	return html.join('')
}

var showModel = function(option) {
	/*title:标题
	 * content:内容
	 * ok:确认点击回调
	 */
	$('#uploadTip .modal-content .modal-title').text(option.title);
	$('#uploadTip .modal-body span').text(option.content);
	$('#uploadTip').modal('show');
	$("#uploadTip #modalYes").on('click', function() {
		if(option.ok instanceof Function) {
			option.ok();
		}
	})
}
var upload = function() {
	myUpload({
		'url': 'upload.php',
		'maxSize': 10,
		'beforeSend': function(file, prvbox) {
			//						$('.uploadBox .progress .progress-bar').css({'width':0})
			//						previewImage(file,prvbox);
		},
		'callback': function(res) {

		},
		'uploading': function(pre) {
			var progress = pre + '%';
			$('.uploadBox .progress').show();
			$('.uploadBox .progress .progress-bar').css({ 'width': 0 })
			$('.uploadBox .progress .progress-bar').css({ 'width': progress });
			$('.uploadBox .progress .progress-bar').text(progress);
		}
	})
}
//上传
var myUpload = function(option) {
	/*option:{
		 'url':'',//上传文件的服务器地址
		 'maxSize':'',//限制大小，单位M
		 'beforeSend':function(){},//上传前回调
		 'callback':function(){},//上传成功回调
		 'uploading':function(){}//上传进度监控
	}*/
	var prvbox = document.getElementById('preview'); //图片预览框
	var fd = new FormData(), //表单对象
		xhr = new XMLHttpRequest(), //ajax对象
		input; //file控件
	input = document.createElement('input');
	input.setAttribute('id', 'myUploadInput');
	input.setAttribute('type', 'file');
	input.setAttribute('name', 'file');
	input.setAttribute('multiple', true);
	document.body.appendChild(input);
	input.style.display = 'none'; //隐藏
	input.click(); //模拟点击
	fileType = ['doc', 'docx', 'xls', 'xlsx', 'pdf', 'jpg', 'png', 'ppt', 'pptx', 'txt', 'zip']; //文件类型限制
	//监听onchange
	input.onchange = function() {
		if(!input.value) { return; }
		//文件类型限制
		var type = input.value.split('.').pop();
		if(fileType.indexOf(type.toLocaleLowerCase()) == -1) {
			showModel({
				title: '提示',
				content: '暂不支持该类型的文件，请重新选择!',
				ok: function() {}
			});
			return;
		}
		//限制文件大小
		if(option.maxSize && input.files[0].size > option.maxSize * 1024 * 1024) {
			showModel({
				title: '提示',
				content: '请上传小于' + option.maxSize + 'M的文件',
				ok: function() {}
			});
			return;
		}
		//上传文件之前
		if(option.beforeSend instanceof Function) {
			if(option.beforeSend(input, prvbox) === false) {
				return false;
			}
		}

		//添加到文件列表
		var uploadFileData = input.files;
		//索引
		//			        var fileIndex = fileList.length-1;
		for(var i = 0; i < input.files.length; i++) {
			//			        	fileIndex ++;
			fileList.push(input.files[i]);
			var oneList = getFileList({
				name: input.files[i].name,
				//			        		fileIndex:fileIndex,
				size: sizeExplain(input.files[i].size)
			});
			console.log(input.files[i].File)
			$(".uploadList table tbody").append(oneList);
		}

		console.log(uploadFileData);
		console.log(fileList);

	}
	//事件解绑
	$('#toUpload').unbind('click');
	$('#toUpload').on('click', function() {
		fd.append('file', fileList); //文件存入表单对象
		xhr.open('post', option.url); //建立ajax请求
		//监听ajax状态
		xhr.onreadystatechange = function() {
			if(xhr.status == 200) {
				if(xhr.readyState == 4) {
					//上传成功回调
					if(option.callback instanceof Function) {
						showModel({
							title: '提示',
							content: '上传成功！',
							ok: function() {}
						});
						option.callback(xhr.responseText);
					}
				}
			} else {
				showModel({
					title: '提示',
					content: '上传失败，请重新上传！',
					ok: function() {}
				});
			}
		}
		//进度条
		xhr.upload.onprogress = function(event) {
			var pre = Math.floor(100 * event.loaded / event.total);
			if(option.uploading instanceof Function) {
				option.uploading(pre);
			}
		}
		xhr.send(fd);
	})
}

//图片预览
function previewImage(file, prvbox) {
	/* file：file控件 
	 * prvid: 图片预览容器 
	 */
	var tip = ""; // 设定提示信息 
	var filters = {
		"jpeg": "/9j/4",
		"gif": "R0lGOD",
		"png": "iVBORw"
	}
	prvbox.innerHTML = "";
	if(window.FileReader) { // html5方案 
		for(var i = 0, f; f = file.files[i]; i++) {
			var fr = new FileReader();
			fr.onload = function(e) {
				var src = e.target.result;
				if(!validateImg(src)) {
					showModel({
						title: '提示',
						content: '文件格式不正确！',
						ok: function() {}
					});
				} else {
					showPrvImg(src);
				}
			}
			fr.readAsDataURL(f);
		}
	} else { // 降级处理

		if(!/\.jpg$|\.png$|\.gif$/i.test(file.value)) {
			showModel({
				title: '提示',
				content: '文件格式不正确！',
				ok: function() {}
			});
		} else {
			showPrvImg(file.value);
		}
	}

	function validateImg(data) {
		var pos = data.indexOf(",") + 1;
		for(var e in filters) {
			if(data.indexOf(filters[e]) === pos) {
				return e;
			}
		}
		return null;
	}

	function showPrvImg(src) {
		var img = document.createElement("img");
		img.src = src;
		prvbox.appendChild(img);
	}

}

//文件大小转换
var sizeExplain = function(size) {
	var a = size / (1024 * 1024);
	return parseFloat(a.toFixed(3)) + 'M';
}
//单个上传
var oneUpload = function(that) {
	var fileData = [];
	var fileIndex = $(".uploadList table tbody tr").index($(that).parent().parent());
	fileData.push(fileList[fileIndex]);
	var fd = new FormData(), //表单对象
		xhr = new XMLHttpRequest(); //ajax对象
	fd.append('file', fileData); //文件存入表单对象
	xhr.open('post', 'upload.php'); //建立ajax请求
	//监听ajax状态
	xhr.onreadystatechange = function() {
		if(xhr.status == 200) {
			if(xhr.readyState == 4) {
				showModel({
					title: '提示',
					content: '上传成功！',
					ok: function() {}
				});
			}
		} else {
			showModel({
				title: '提示',
				content: '上传失败，请重新上传！',
				ok: function() {}
			});
		}
	}
	//进度条
	xhr.upload.onprogress = function(event) {
		var pre = Math.floor(100 * event.loaded / event.total);
		var progress = pre + '%';
		$(that).parent().parent().find('.progress').show();
		$(that).parent().parent().find('.progress-bar').css({ 'width': 0 })
		$(that).parent().parent().find('.progress-bar').css({ 'width': progress });
		$(that).parent().parent().find('.progress-bar').text(progress);
	}
	xhr.send(fd);
}
//单个删除
var oneDelete = function(that) {
	//console.log(that.dataset.upload);
	//索引
	var fileIndex = $(".uploadList table tbody tr").index($(that).parent().parent());
	fileList.splice(fileIndex, 1);
	$(".uploadList table tbody tr").eq(fileIndex).remove();
	console.log(fileList);
}

//全部移除
var allRemove = function() {
	fileList.splice(0, fileList.length);
	$(".uploadList table tbody").empty();
}