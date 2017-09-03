<?php
use \GatewayWorker\Lib\Gateway;
$online = ''; //存储在线客服
$sid = ''; //存储在线客服的唯一ID
class Events{
  /*
  * Events.php中定义5个事件回调方法，
  * onWorkerStart businessWorker进程启动事件（一般用不到）
  * onConnect 连接事件(比较少用到)
  * onMessage 消息事件(必用)
  * onClose 连接断开事件(比较常用到)
  * onWorkerStop businessWorker进程退出事件（几乎用不到）
  */

  /**
  * 当客户端连接时触发
  * 如果业务不需此回调可以删除onConnect
  * int $client_id 连接id
  */
  public static function onConnect($client_id){
    // 向当前client_id发送数据
    Gateway::sendToClient($client_id, "Hello $client_id");
    // 向所有人发送
    //Gateway::sendToAll("$client_id login");
  }

  /**
  * 当客户端发来消息时触发
  * int $client_id 连接id
  * string $message 具体消息
  */
  public static function onMessage($client_id, $message){
    global $online;
    global $sid;
    // 因为一开始做的是多个客服的，所以设置了一个“userlink”的消息类型用来表示用户刚发起ws连接
    // 用以返回在线客服列表，用户即可选择客服聊天
    // 后来是因为只需要一个客服就没做那么多了
    // 这些设置就先留着了，以防以后有需要再改
    // 所有这个“userlink”不用管，用户端主要就是把消息发给客服端
    if($message !== 'userlink'){
      $message = json_decode($message);
      $message->time = date('Y-m-d H:i:s');
      if($message->type === 'server'){
        // 消息类型为“server”是客服端发来的消息
        if(!$online){ 
          // 如果当前没有客服在线，则为当前客服绑定她的uid
          // 这样不论客服刷新多少次，只要她重新上线，用户就能根据这个uid找到她
  		    Gateway::bindUid($client_id, $message->from);
          $online = $message->from;
  		    $sid = $client_id;
          // 获取当前与该客服聊天的用户，将客服上线的消息广播给他们
    		  if(Gateway::getClientCountByGroup($message->from)){
            $message->type = 'ifonline';
            $message->msg = '当前客服已上线';
            Gateway::sendToGroup($message->from, json_encode($message));
    		  }
        }else if($client_id === $sid){
          // 如果是当前在线的客服，则将消息发给当前与客服聊天的用户
    			if($message->to && $message->msg){
    			  Gateway::sendToClient($message->to, json_encode($message));
    			}
    		}else{
          // 如果当前已有客服在线，则返回提示信息，客服端将做出对应处理
    			$msg->type = 'someone';
    			$msg->msg = '当前已有客服在线';
    			Gateway::sendToClient($client_id, json_encode($msg));
    		}
        //echo($online);
      }else if($message->type === 'user'){
        // 消息类型为“user”是用户端发来的消息
        $message->from = $client_id;
        Gateway::joinGroup($client_id, $message->to); // 将同一个客服的用户归到一组
        //var_export(Gateway::getClientSessionsByGroup($message->to));
        $message->userlist = Gateway::getClientSessionsByGroup($message->to);
        Gateway::sendToUid($message->to, json_encode($message));
      }
    }else{// 用户刚接入，返回在线客服数组
      $msg->type = 'online';
      $msg->online = $online;
      Gateway::sendToClient($client_id, json_encode($msg));
      //echo "linked";
    }
  }

  /**
  * 当用户断开连接时触发
  * $client_id 连接id
  */
  public static function onClose($client_id){
	global $online;
	global $sid;
    $message->type = 'logout';
    $message->msg = '';
    $message->to = '';
    $message->from = $client_id;
    $message->time = '';
    $message->userlist = array();
	if($client_id === $sid){ // 如果是当前客服下线
		$message->type = 'ifonline';
		$message->msg = '当前客服已离线，请稍候再试';
		Gateway::sendToGroup($online, json_encode($message));
		$sid = '';
		$online = '';
	}else{
	    Gateway::leaveGroup($client_id, $online);
		// 向所有人发送
		GateWay::sendToAll(json_encode($message));
	}
  }
}
