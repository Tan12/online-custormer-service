$(function(){
  var $userList = $('#user-list'),
      $showBox = $('.show-box'),
      //$showMsg1 = $('#show-msg-1'),
      $chatBox = $('#chat-box'),
      $msg = $('#msg'),
      $sm = $('#sm'),
      $message = {},
      height = [], // 存储各个聊天框的高度
      cur_users = [], // 当前与客服聊天的所有用户id
      num = 0; // 开启服务后与客服聊天的用户人数，用户登出后不减1，会出现重复数字

  $message.type = 'server'; // 发消息的人
  $message.msg = ''; // 消息内容
  $message.to = ''; // 这个消息是发给谁的
  $message.from = '001'; // 这个消息是来自谁的
  $message.time = '';
  $message.userlist = []; // 当前对话的用户id

  var ws = new WebSocket("ws://"+document.domain+":10081");
  ws.onopen = function() {
    //console.log("连接成功");
    ws.send(JSON.stringify($message));
  };

  // 表单提交
  $chatBox.submit(function(){
    if(!$msg.val()){
      alert('请输入内容~');
    }else{
      $message.msg = $msg.val();
      var to = $userList.find("input[type='radio']:checked").val();
      $message.to = to ? to : '';
      //console.log(JSON.stringify($message));
      console.log($message);
      ws.send(JSON.stringify($message));
      if($message.to){
        var $section = $('<section>'),
            $p = $('<p>').text($msg.val()).addClass('right'),
            tag = userNum($message.to);
        //console.log(tag);
        $section.append($p);
        var $curDiv = $('#show-msg-' + tag);
        $curDiv.append($section);
        if(heightChange($curDiv[0].scrollHeight, tag)){
          $curDiv.scrollTop(height[tag]);
        }
      }
      $msg.val('');
    }
    return false;
  });

  ws.onmessage = function(msg){
    //console.log(msg);
    var $data = msg.data,
        $user2,
        $obj,
        user_id; // 用户唯一id

    // 判断是不是json数据，不是的话就是欢迎语
    if($data.indexOf('{') !== -1){
      $obj = $.parseJSON($data);
      //console.log($obj)
      if($obj.type === 'user'){
        var $section = $('<section>'),
            $p = $('<p>').text($obj.msg).addClass('left');
        $section.append($p);

        // 如果是新用户则添加到用户列表，且新建一个聊天框
        if(!in_array(cur_users, $obj.from)){
          cur_users.push($obj.from);
          num++;
          $userList.find('input:radio').attr('checked', false);
          $userList.find('label').removeClass('current');
          // 添加到用户列表
          var $div = $('<div>').addClass('tags');
              $close = $('<span>').text('x').addClass('close').hide(),
              $label = $('<label>').attr('for', 'user'+num).text('用户' + num).addClass('current'),
              $radio = $('<input>').attr({'type':'radio','id':'user'+num,'value':$obj.from,'name':'user',"checked":true}).addClass('hidden');
          $div.append($radio).append($label).append($close);
          $userList.append($div);

          // 切换聊天用户
          // 绑定点击事件，当前函数之外绑定无效
          // 绑定已定义函数点击事件只能生效一次，so~
          $radio.on('click', function(){ // 切换聊天用户
            $userList.find('label').removeClass('current');
            $userList.find('input:radio').attr('checked', false);
            $(this).attr('checked', true);
            $(this).next('label').addClass('current').removeClass('new');
            var index = $(this).attr('id').substr($(this).attr('id').length-1,1);
            //console.log(index);
            // 将选中的用户聊天框置顶，其他聊天框移去置顶class样式
            $('#show-msg-' + index).addClass('current-user').siblings('div[id^=show-msg]').removeClass('current-user');
          });

          // 关闭事件
          // 只有用户退出后才能关闭聊天框
          $('.close').on('click', function(){
            var del_u = $(this).siblings('label').attr('for'),
                del_n = del_u.substr(del_u.length-1, 1);
            // 从用户列表中移除退出的用户
            $(this).parent('div').remove();
            // 移除聊天框
            $('#show-msg-' + del_n).remove();

            // 将当前用户列表中的第一个用户置顶
            if($userList.children('div')){
              $userList.find('label').removeClass('current');
              $showBox.children('div').removeClass('current-user');
              $userList.children('div').eq(0).children('label').addClass('current');
              var top_u = $userList.children('div').eq(0).children('label').attr('for'),
                  top_n = top_u.substr(top_u.length-1, 1);
              $('#show-msg-' + top_n).addClass('current-user');
			  $('#user' + top_n).attr('checked','checked');
            }
          });

          // 新建聊天框
          var id_name = 'show-msg-' + num,
              $div  = $('<div>').attr('id', 'show-msg-' + num);
          $div.addClass('current-user').append($section);
          $showBox.append($div);
          $div.siblings('div[id^=show-msg]').removeClass('current-user');
          height[num] = $div.height(); // 存储每个聊天框的初始高度
        }else{
          // 如果是已经在聊天的用户则找到对应聊天框添加对话
          tag = userNum($obj.from);
          var $curDiv = $('#show-msg-' + tag);
          $curDiv.append($section);

          // 添加消息提醒
          var $la = $('label[for=user'+ tag +']');
          if(!$la.hasClass('current')){ // 当前聊天框不是要添加消息的地方
            $la.addClass('new');
          }

          // 使滚动条置于底端
          if(heightChange($curDiv[0].scrollHeight, tag)){
            $curDiv.scrollTop(height[tag]);
          }
        }
      }else if($obj.type === 'logout'){ // 有用户退出，只有type跟from有值
        console.log($obj.from + 'logout');

        // 离开用户的聊天界面提示“用户离开”
        var $list = $userList.find('input');
        for(var j = 0, n = $list.length; j < n; j++){
          if($list.eq(j).val() === $obj.from){
            var u = $list.eq(j).siblings('label').attr('for'),
                n = u.substr(u.length-1, 1);
            var $section = $('<section>'),
                $p = $('<p>').text('系统提示：该用户已离开').addClass('center');
            $section.append($p);
            $('#show-msg-' + n).append($section);
            $list.eq(j).siblings('span').show();
          }
        }
      }else if($obj.type === 'someone'){ //有客服在线了，只有type跟msg有值
	     alert($obj.msg);
		 window.location = 'http://weixin.szrdit.com/index.php?g=System&m=Admin&a=index';
      }
    }else{
      console.log($data);
    }
  };

  // 返回uid对应的是用户几
  function userNum(uid){
    var x = 0,
        $list = $userList.find('input[type="radio"]'),
        l = $list.length,
        tag; // 用户n
    for(x; x < l; x++){
      if($list.eq(x).val() === uid){
        var u = $list.eq(x).attr('id');
        tag = u.substr(u.length-1, 1);
      }
    }
    return parseInt(tag);
  }

  // 判断聊天框高度是否发生改变
  // $ele：要判断的聊天框对象的总高度
  // n：聊天框对应的id号
  function heightChange(h, n){
    //console.log(h);
    if(h > height[n]){
      height[n] = h;
      return 1;
    }
    return 0;
  }

  // 判断数组arr是否包含元素item
  function in_array(arr, item){
    for(var j = 0, l = arr.length; j < l; j++){
      if(arr[j] === item){
        return 1;
      }
    }
    return 0;
  }
});
