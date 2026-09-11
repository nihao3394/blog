---
title: about
menu_id: about
date: 2026-03-2 07:46:06
layout: page
type: page
---

# 关于我
苦逼大学生一枚，b站重度用户，小黑盒住户，最近正在沉迷《杀戮尖塔》，计算机网络

## 我的B站动态
{% timeline api=bilibili limit=10 %}
<!-- 留空即可，数据会从本地JSON自动读取 -->
{% endtimeline %}

## 我的Steam游戏动态
{% timeline api=steam limit=10 %}
{% endtimeline %}