十分钟学会JavaScript
====================

###作者Spencer Tipping###

1 简介
------------------

本指南适用于任何知道一些Javascript，并想快速[1]了解其先进功能的读者。如果你还了解另一种函数式语言，如Ruby，Perl，Python或ML，Scheme等，它会更容易阅读，因为我没有解释初级的函数原理。 
>1.会超过10分钟，尽管标题这么写。

2 类型
------------------

JavaScript有九种类型。分别为：

1. 空值类型（null）- 它没有任何属性。例如：null.foo 无效。类型unboxed[1]。
2. 未定义（undefined）- 访问未创建对象的返回。例如：document.nonexistent。也没有任何属性，类型unboxed。
3. 字符串（string） - 例如：'foo'，"foo"（单、双引号没有区别）。某些时候类型boxed，例如作为字符串实例时。
4. 数值（Numbers） - 例如：5, 3E+10（在除法运算时所有的数字以浮点方式处理，但可以通过X >>> 0方式截断）。某些时候类型boxed，例如数字实例时。
5. 布尔（bool） - true或者false。某些时候类型boxed，例如布尔实例时。
6. 数组（Array） - 例如： `[1，2，"foo"，[3，4]]`。类型boxed，数组实例。
7. 对象（Objects） - 例如：哈希表`{foo：'bar'，bif：[1，2]}`。类型boxed，对象实例。
8. 正则表达式（RegularExpression） - 例如： `/foo\s*([bar]+)/`。类型boxed，RegExp实例。
9. 函数（Functions）- 例如：`function(x) {return x + 1}`。类型boxed，函数实例。
 
实际上空值几乎是从来不会通过Javascript产生的。只有一种情况，你可能会碰到空值，如果你指定的地方（大部分时间，你会得到未定义，一个值得注意的例外是document.getElementById，如果找不到对应元素它返回NULL）。一般情况下，建议使用未定义类型， 而不是使用空类型，这样可以使错误更容易追查。

>2.Boxing是指的其是否由指针表示。boxed类型是一个引用类型，unboxed类型是一个值类型。在JavaScript中，这会有额外的影响，可参见4.6节。

3 函数（Functions）
-----------------------------

函数功能是第一级的词法闭包[3]，类似于Ruby的lambdas或Perl的subs[4]。函数的基本用法很简单，但也有一些很酷的内容和一个极其恶劣的问题。

>3.第一级意味着使用者可以在运行时将其以值的形式传递，但由于通过toString函数获取的只是其源码，不能真正获取其所包含的值，因此实质上不可能观察其内质。

>4.注意不存在块作用域，JavaScript中整个函数为一个作用域。

###3.1 可变参数行为（一个很酷的东西）###

函数都是可变参数的[5]。形参对应的实参如果存在则被绑定，;否则为未定义。
例如：

    (function (x, y) {return x + y;}) ('foo')       // =>'fooundefined'

函数的参数可以作为第一级对象被直接访问：

    var f = function () {return arguments[0] + arguments[1];};
    var g = function () {return arguments.length};
    f ('foo')                     // => 'fooundefined'
    g (null, false, undefined)    // => 3

关键字arguments不是一个数组！它只是看起来像。如下使用则会引起错误：

    arguments.concat ([1, 2, 3])
    [1, 2, 3].concat (arguments)
    arguments.push ('foo')
    arguments.shift ()

从arguments对象获取数组可以用`Array.prototype.slice.call (arguments)`。这是所知最好的获取方式。

>5.函数可接收参数数目被称为它的实参数量(arity).所以单子(monadic)的一元函数只接受一个参数，二价(dyadic)的二元函数接受二个函数，以此类推。如果一个函数可以接收任意数目参数，那么其是可变参数的(variadic)。

###3.2	惰性作用域（一个很酷的东西）}###
在内部函数使用词法作用域链。然而，在函数体内的变量都不会被解释，直到函数被调用。这会带来一些非常好的优势，也许其中最重要的就是自指(self-reference)：

    var f = function () {return f;};
    f () === f;              // => true

>珍闻病理：惰性作用域的一个重要后果是，你可以创建一个指向可能永远不存在的变量的函数。这使得使用Javascript很难调试。好消息是，JavaScript可以通过toString方法支持句法宏：

>        var f = function () {return $0 + $1;};
>        var g = eval (f.toString ().replace(/\$(\d+)/g, 
>                  function (_, digits) {return 'arguments[' + digits + ']'}));
>        g (5, 6)
>理论上通过扩展此原则，可以实现真正的结构宏，运算符重载，类型系统[6]，或其他东西。

>6.但愿不会如此！


###3.3 this的含义（令人震惊的灾难）###

this是什么？这个问题看起来很简单，但实际上相当具有挑战性，而JavaScript使它成为近乎不可能回答清楚。当位于函数外（即全局域），this指向特定的全局对象，在浏览器环境中是window对象。本质的问题是在函数内部this会有什么的行为，而这会取决于函数本身的调用方式。具体如下：

1. 如果该函数被直接调用，如`foo(5)`，那么该函数的内部的this将指向全局对象。
2. 如果该函数作为对象的方法被调用，如`x.foo（5）`，那么该函数内部的this指向该对象，例子中为对象X。
3. 如果该函数开始为对象的方法，然后被直接调用：
    
        var f = x.foo;
        f(5);
那么this重新指向全局函数。调用方式决定this的指向，f的赋值方式并不会对此产生影响。
4. 如果该函数调用使用apply或call，此时this指向所设置的对象（除非尝试将其设置为null或undefined，此种情况this将重新指向全局函数)：
        
        var f = function() { return this; };
        f.call(4)       // => 4
        f.call(0)       // => 0
        f.call(false)   // => false
        f.call(null)    // => [全局对象(object global)]

鉴于此种不可预知性，很多JavaScript库提供了方法来设置函数this绑定至某调用不变量（在JavaScript圈子中称为函数绑定）。一个极简方案是定义一个函数利用apply传递参数和正确this值（幸运的是，闭包变量行为正常）：

    var bind = function(f, this_value) {
        return function() { return f.apply(this_value, arguments); };
    };

apply和call之间的区别很简单：`f.call(x, y, z)`等同于`f.apply(x, [y, z])`，这与`bind(f, x)(y, z)`是一样的。也就是说，call和apply的第一个参数会作为函数的this所指向的对象，其余则作为参数传递给函数。在apply中传递的参数集合应在一个数组中，而call中则直接将给定的参数转发（第一个参数除外）。

####3.3.1 重要的结果：ETA简化

在大多数函数语言中，你可以eta简化事物，即如果你有一个函数如：`function (x) {return f (x);}`，你可以使用`f`替代。 但在Javascript这并不总是一个安全的变换；考虑如下的代码：

    array.prototype.each = function (f) {
        for (var i = 0, l = this.length; i < l; ++i)
            f (this[i]);
    };
    
    var xs = [];
    some_array.each (function (x) {xs.push(x)});

下面更为简洁的改写看起来非常诱人：

    some_array.each（xs.push）;

但是后者将导致一个难以预见的Javascript错误，因为内置函数Array.push的this此时指向一个全局对象，而不是xs。 原因显而易见：一个函数在each内部被调用时，它是作为一个function而不是一个method被调用。此函数是xs的一个方法这个事实已被被遗忘。（如上例子3忘记）

this最简单的方法是绑定xs.push到xs：

    some_array.each (bind (xs.push, xs));

####3.3.2 怪事：this从来不是假值(falsy)####
如4.6节中的解释，this将永远不会被设置为假值。如果尝试将其设置为空(null)或未定义(undefined)，如下：

    var f = function () {
        return this;
    };
    f.call (null);    // 返回是否为null？

事实上，它会返回全局对象，通常在浏览器为window对象。如果使用原生类型的假值，this将指向此值的装箱版本。这有一些有悖常理，更详细分析请见5.4节。

4 Gotchas
------------------------

JavaScript是一个出色的语言，就像Perl是一个出色的语言，Linux是一个很棒的操作系统一样。如果你知道如何正确地使用它，它事无巨细的解决j几乎所有问题，但如果你错过了它的任一微妙之处，你将花几个小时解决错误。下面所列问题应涵盖了大部分JavaScript的语言问题[7]。

>7.虽然一般看来JavaScript是一个优秀的语言，但还是有很多问题。对想将事情快速处理完毕和错误鉴赏家来说JavaScript都是一个理想的选择。

###4.1 分号推断###

如果总是用分号结束线，就不会碰上任何麻烦。然而，大多数浏览器认为分号是可选的，因此如果选择省略他们，有一个潜在的惊奇等待着。

大部分时候Javascript会做到需要做的事情。唯一可能的例外情况是当以一个开放的括号开始一行的时候，如下：

    var x = f
    (y = x) (5)

Javascript会将合二为一：

    var x = f (y = x) (5)

据知，解决这个问题的唯一方法是在第一行末尾放置分号。

###4.2 空隙函数(void function)###

每一个函数都会有一个返回值。如果函数不使用return语句，那么会返回未定义(undefined)；相反则返回指定的值。Ruby或Lisp的使用者经常会犯这样的错误，例如：

    var x = (function (y) {y + 1;}) (5);

返回会结果为未定义(undefined)。如果你有可能在这栽倒，Emacs有个“JS2模式”用来标识函数无副作用(side-effects)或返回值，可以捕捉住大部分此类错误。[8]

>8.当然，如果你是Emacs用户。如果你喜欢一个真正的编辑器（眨眼），本人编写了一个自定义JS高亮插件，某些情况下比内建要好：   [http://github.com/spencertipping/js-vim-highlighter](http://github.com/spencertipping/js-vim-highlighter)

###4.3 var###

注意如何定义一个变量，如果不使用var关键字，变量将被定义在全局作用域内，这可能会导致一些非常微妙的错误：

    var f = function () {    // f位于顶层，所以是全局变量
        var x = 5;           // x是f内的局部变量
        y = 6;               // y是全局变量
    };

据知，在for循环两种类型中同样适用：

    for (i = 0; i < 10; ++i)     // i是全局变量
    for (var i = 0; i < 10; ++i) // i是函数内的局部变量
    for (k in some_object)       // k是全局变量
    for (var k in some_object)   // k是函数内的局部变量

###4.4 惰性区域和可变性###
这是个优雅的灾难。请看：

    var x = [];
    for (var i = 0; i < 3; ++i)
        x[i] = function () { return i; };

    x[0]();   //结果将会是什么？
    x[1]();
    x[2]();

当着三个函数被调用时会返回什么？可能期望分别返回0，1和2，因为这是当它们被创建时i的值。但实际上它们都将返回3。这是因为JavaScript的惰性区域：创建后，每个函数只接收一个变量名和搜索范围，变量值并未被获取直到被调用时，此时i等于3。

最简单的解决方法，是引入另外一层作用域，将赋值包在一个立即执行的匿名函数中。下面的代码结果正常，因为在封闭的匿名函数中new_i的值不变。

    for (var i = 0; i < 3; ++i)
        (function (new_i) {
            x[new_i] = function () { return new_i; };
        }(i);

顺便说一下，有人可能倾向如下方式：

    for (var i = 0; i < 3; ++i) {
        var j = i;
        x[j] = function () { return j; }
    }

这并不起作用，j的值域范围是其最接近的外包函数（记住，JavaScript的作用域是函数级别，不是块级别），所以j和i的值同时在改变。

###4.5 相等###

因为==操作符的不足，以下语句在Javascript中均成立：

    null == undefined
    null == 0
    false == ''
    '' == 0
    true == 1
    true == '1'
    '1' == 1

因此，除非真的需要以上行为，否则绝不要使用==操作符。使用===操作符（相反为!==），其行为表现合理。特别是，===操作符需要两个操作数不仅是相同值同时也要有相同类型的。它会对装箱值进行引用比较而对未装箱值进行结构比较。如果一侧为装箱值而另一侧为未装箱值，===操作符将返回false。不过因为字符串字面量是未装箱的，因此在如下语句使用：`'foo' === 'fo' + 'o'`。

还有一种情况，==操作符要比===操作更加有用。当想找出某个对象是否有一个属性表（即不是空(null)或未定义(undefined)，最简洁的方法是`x == null`，而不是更明确的`(x === null || x === undefined)`。除此之外，不常见应用==操作符。[9]

>珍闻病理：==操作符甚至在真值(truthiness)上也不稳定。如果`x = 0`和`y = new Number(0)`，那么`x == y`为真，`!!x`为假而`!!y`为真。节4.6详细讲述为何发生此类事情。

>9.事实上，不这样做的原因是为了取得更好的安全性。参见4.8节那令人生畏的细节。

###4.6 装箱与拆箱###

装箱值始终为真而且可以具有属性(properties)。未装箱值则不具有属性。例如：[10]

    var x = 5;
    x.foo = 'bar';
    x.foo    // => undefined; x为未装箱值

    var x = new Number (5);
    x.foo = 'bar';
    x.foo    // => 'bar'; x为指针

何时可装箱值会被装箱？如下任一情况：

1. 直接调用其构造，象上例中所做的
2. 设置它的prototype中的成员函数，并在此函数中引用this（参见节5，特别是节5.4）
3. 在使用函数的call或apply方法时将其作为第一参数传入（参见节3.3.2）

所有的HTML对象不管是否为本地(native)对象都将被装箱。

>10.装箱的其他后果见4.11节和4.12节的一些例子。

###4.7 静默失败或行为错误的事###

Javascript是非常宽松对于错误的语句。尤其是下面的语句都是完全合法的：

    [1, 2, 3].foo     // => undefined
    [1, 2, 3][4]      // => undefined
    1 / 0             // => Infinity
    0 * 'foo'         // => NaN

这会非常有用。几个常用的惯用法，如下：

    e.nodeType || (e = document.getElementById(e));
    options.foo = options.foo || 5;

此外，如果使用+操作符，语言将任何对象转换为字符串或数字。如下所有这些表达式是字符串：

    null + [1, 2]
    undefined + [1, 2]
    3 + {}
    '' + true

如下都为数字：

    undefined + undefined    // => NaN
    undefined + null         // => NaN
    null + null              // => 0
    {} + {}                  // => NaN
    true + true              // => 2
    0 + true                 // => 1

如下一些个人的最爱：

    null * false + (true * false) + (true * true)      // => 1
    true << true << true                               // => 4
    true / null                                        // => Infinity
    [] == []                                           // => false
    [] == ![]                                          // => true

###4.8 数字强制转换###

这是个会让人措手不及的问题。JavaScript的类型强制转换有时有不一致的属性。例如：

    {}            // truthy
    !!{}          // 强制转换为布尔类型，为真
    +{}           // 强制转换为数字类型
    []            // 真
    !![]          // 强制转换为布尔类型，为真
    +[]           // 强制转换为数字类型，0，布尔值为假

    [] == false   // 真（因为[]为0，或类似值）
    [] == 0       // 真
    [] == ''      // 真（因为0 == '')
    [] == []      // 假（因为其为不同对象引用，无强制转换）
    [1] == [1]    // 假（因为其为不同对象引用，无强制转换）
    [1] == +[1]   // 真（等式右侧为数字，强制转换）

当你合用非数字值与特定操作符时需要注意这样的事情。例如，如下函数不能识别一个数组内是否包含任何真值：

    var has_truthy_stuff = function (xs) {
	    var result = 0;
        for (var i = 0, l = xs.length; i < l; ++i)
            result |= xs[i];
        return !!result;
    };
    has_truthy_stuff([{}，{}，0])   //返回false

has_truthy_stuff返回false的原因是因为当{}被强制转换为数字，就变为NaN，在Javascript为假值(falsy)。|=操作符对NaN和0表现的一样，什么也没有改变。所以对于此数组结果为0，于是该函数失败。

顺便说一下，你可以通过重新定义valueOf方法改变数值强制转换行为：

    +{valueOf: function () {return 42}}            // -> 42
    Object.prototype.valueOf = function () {
	return 15;
    };
    Array.prototype.valueOf = function () {
	return 91;
    };
    +{}	        // -> 15
    +[]	        // -> 91
    +[1]        // -> 91

这有一些有趣的事情值得思考。首先，valueOf()可能会永不停止。如：

    Object.prototype.valueOf = function () {
        while (true);
    };
    {} == 5     // 永不返回；{}被强制转换为数字   
    +{}         // 
    !{}

再次，valueOf只是一个普通的Javascript函数，因此此处存在安全漏洞。特别是，假设使用eval()作为一个JSON解析器（这可不是一个好主意）而且也没有检查输入是否符合规范。如果有人发送`{valueOf() {while(true);}}`，那么当开始将此对象进行强制转换为数字时（强制转换可以是隐式的，如上`== 5`）程序将会被挂起。

>珍闻病理：数组的数值取决于其内容：

>       +[0]            // 0
>       +[1]            // 1
>       +[2]            // 2
>       +[[1]]          // 1
>       +[[[[[1]]]]]    // 1
>       +[1, 2]         // NaN
>       +[true]         // NaN
>       +['4']          // 4
>       +['0xff']       // 255
>       +['  0xff']     // 255
>       -[]             // 0
>       -[1]            // -1
>       -[1, 2]         // NaN


>如果数字嵌套深度过多，内置数组到数字的强制转换方法会出现堆栈溢出错误。例如：

>       for(var x = [], a = x, tmp, i = 0; i < 100000; ++i) {
>            a.push(tmp = []);
>            a = tmp;
>        }
>        a.push(42);     // 获取所需值的嵌套深度为10000
>        x == 5          // V8中堆栈溢出

>幸运的是，至少在V8中，自身包含的数组的数字强制转换是定义良好的，所以下面的例子没有它应该有的那么有趣：[11]

>       var a = [];
>       a.push(a);
>       +a              // 0

>11.这只需重新定义valueOf就可以很容易地改变

###4.9 显著失败的事###

在如下方面Javascript将会报错。如果调用一个非函数，向空(null)或未定义(undefined)请求一个属性，或引用一个不存在的全局变量[12],Javascript将抛出一个TypeError或ReferenceError异常。推而广之，引用不存在的局部变量导致ReferenceError异常，因为Javascript认为所指为全局变量。

>12.要解决此类错误，可以用`typeof foo`, foo为可能不存在的全局变量。它将返回"未定义(undefined)"（或包含值未定义(undefined)）。

###4.10 抛出异常###

可以在抛出很多不同的异常，包括未装箱值。这有一定的优势，如下代码：

    try {
        ...
        throw 3;
    } catch (n) {
        // n没有堆栈轨迹！
    }

此throw/catch并不计算堆栈轨迹，使得异常处理比平时快不少。但对于调试来说，如下抛出一个适当的错误是更好的：

    try {
        ...
        throw new Error(3);
    } catch (e) {
        //e中含有堆栈轨迹，即使在Firebug也是有用的
    }

###4.11 小心运用typeof###

因为它的行为是这样的：

    typeof function () {}       // => 'function'
    typeof [1, 2, 3]            // => 'object'
    typeof {}                   // => 'object'
    typeof null                 // => 'object'
    typeof typeof               // => Firefox中挂起

许多情况下用typeof操作符来检测对象类型是个较差的选择[13]。更好方式是使用对象的constructor属性，如下：

    (function () {}).constructor        // => Function
    [1, 2, 3].constructor               // => Array
    ({}).constructor                    // => Object
    true.constructor                    // => Boolean
    null.constructor                    // => TypeError: null没有任何属性

为避免空(null)和未定义(undefined)（它们的构造均不可被访问），可能会基于它们的假值特性：

    x && x.constructor
    
但实际上这会让''，0，false，NaN及其它可能值均失败。据知解决这个问题的唯一途径，是对其做比较：

    x === null || x === undefined ? x : x.constructor
    x == null ? x : x.constructor       // 同上，但更简洁
    
另如只是想确定某个对象是否是一个给定类型，可使用instanceof操作符，它永远不会抛出异常[14]。

>13.由于其返回一个字符串，也略慢于使用.constructor。
>14.嗯，差不多。如果在instanceof操作符放置空(null)，未定义(undefined)，或类似不适合对象，则会得到一个TypeError异常。

###4.12 谨慎使用instanceof###

一般来说instanceof比typeof操作符更为有用，但只能用于装箱值。如下均为假：

    3 instanceof Number
    'foo' instanceof String
    true instanceof Boolean

然而，如下均为真：

    [] instanceof Array
    ({}) instanceof Object
    [] instanceof Object        // 数组(Array)继承于Object
    /foo/ instanceof RegExp     // 正则表达式始终为装箱值
    (function () {}) instanceof Function

解决前面问题方法之一是包装原生值：

    new Number(3)   instanceof Number       // true
    new String('foo') instanceof String     // true
    new Boolean(true) instanceof Boolean    // true

一般情况下，（`new x.constructor(x) instanceof x.constructor`）对所有的原生值x均为真。然而，这对空(null)或未定义(undefined)不成立。当调用它们的构造时将抛出错误，而不会从一个构造函数调用的结果返回（就是使用new操作符）。

###4.13	浏览器不兼容###

一般来说，从IE6起浏览器对语言核心都有良好的兼容性。然而，一个值得注意的例外是，IE浏览器的错误影响`String.split`：

    var xs = 'foo bar bif'.split (/(\s+)/);
    xs              // 正常浏览器：['foo', ' ', 'bar', ' ', 'bif']
    xs              // IE: ['foo', 'bar', 'bif']

一个更微妙的错误，花了几个小时发现是IE6不会返回函数从eval()：

    var f = eval('function() {return 5}');
    f()             // 正常浏览器： 5
    f()             // IE6: 期待对象（因为f未定义(undefined)）

肯定有其他类似的错误存在，但最常见的导致的问题一般都是在DOM中[15]。

>15.这方面jQuery的是你的朋友。它是以Javascript库而闻名，但实际上它是一个DOM增强集：（1）实现了统一的跨浏览器API，（2）简化获取和处理节点操作。

5 原型对象(prototype)
-------------------------

原来这里有个非常反OOP的评论，但考虑偶尔会使用原型所以去除了它。尽管对Javascript语言妥协迎合Java影响的市场压力[16]存在明显甚至有些不公的仇视，但基于原型的编程有时还是有用的。本节具有个人主观想法和偏见。

每当定义一个函数它会有两个目的。一是每个程序员所假定的一个函数接受参数并返回值，或者可以是一个变异的实例生成器做完全不同的事。下面是一个例子：

    //一个正常的函数：
    var f = function (x) {return x + 1};
    f (5)      // => 6

这是大多数人的预期。通常理性的人不会想到如下的突变行为：

    //构造函数
    var f = function (x) {this.x = x + 1};      // 无返回
    var i = new f (5);                          // i.x = 6

基于此是下列语句为真：

    i.constructor === f
    i.__proto__ === i.constructor.prototype
    i instanceof f
    typeof i === 'object'

关键字`new`为右关联（前缀）一元运算符，所以可以实例化顶级对象：

    var x = 5;
    new x.constructor ();      //创建一个x的装箱版本，不管x是什么
    new new Function('x', 'this.x = 5');

如果使用这令人疑惑的设计模式编程，那可能会想在原型对象中添加一些方法[17]：

    var f = function (x) {this.x = x};
    f.prototype.add_one = function () {++this.x};
    var i = new f (5);
    i.add_one();
    i.x                 // => 6

可以在线找到很多关于此类原型对象编程的信息。

>16.看它的名字，JavaScript，尽管全无相似之处。
>17.本节以前写为`i.x`将被计算为7。但这是不对的，正如所指它实际上是6。 （谢谢Daniel Gasparotto指出这一点。）

###5.1	为什么new操作符很麻烦###

    new操作符有些很酷的特性（如作为第一级对象），但它有一个很可怕的缺点。在Javascript中的大部分函数可以被转发(forwarded) - 也就是说，可以写一个新的函数来包装现有的函数，其被调用时并不会发现其差别。例如：

    var to_be_wrapped = function (x) {return x + 1};
    var wrapper = function () {
        return to_be_wrapped.apply(this, arguments);
    };
    // 对所有的x，wrapper(x) === to_be_wrapped(x)

然而，new操作符没有这样的机制，在一般情况下无法转发构造，因为new操作符没有apply方法的对等调用方式。 （但这并不完整; 下一节将介绍一个天才的解决办法。）

###5.2 为什么new操作符是不那么可怕###

最近收到一封Ondrej Zara的一封电子邮件说对new 操作符的偏见是不正确的，并对上节中抱怨的问题，有一个非常优雅的解决方法。这里是其实现：

    var Forward = function (ctor /*, args... */) {
        var tmp = function () {};
        tmp.prototype = ctor.prototype;
        var inst = new tmp();
        var args = [];
        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        ctor.apply(inst, args);
        return inst;
    }

下面是使用的例子：

    var Class = function(a, b, c) {}
    var instance = Forward(Class, a, b, c);
    instance instanceof Class;      // true

    起初很怀疑这种做法会工作，但还没有找到它失败的例子。这样在Javascript中构造的确可以被转发，与之前的声明相反。

###5.3 为什么要使用原型对象(prototype)###

如果需要一个动态的分发模式，那么原型对象可能是最好的押注，应该使用它们而不是构建自己的方法。Google的V8针对原型对象做了一系列特定的优化，如同较新发布的Firefox版本。此外，原型对象会节省内存，因为用一个指针指向原型对象是比用n个指针指向n个属性要节约很多。

    另一方面，如果发现正在实现的继承层次结构，那么很可能犯了错。原型在JavaScript是实现继承的有效途径，但在Javascript中继承（1）是慢；（2）是对JavaScript的“一切都是公开的”模型的很差表现。

>18.好吧，这一点有所偏颇。个人认为Javascript与Scheme而不是Smalltalk更类似，所以并未太多考虑经典的面向对象建模。此外闭包很快，非常适用函数式抽象而不是继承。 JavaScript是更适合元编程而不是继承。

>19.在某些情况下很慢。例如，在Firefox 3.5中单层和多层的原型对象查找效率差异巨大。

###5.4	自动装箱###
可能会尝试做类似如下的事：

    Boolean.prototype.xor = function (rhs) {return !! this !== !! rhs};

当运行此代码后，遇到这个惨遭不幸的属性时：

    false.xor (false)            // => true

原因是，当把一个未装箱值作为一个对象（例如，调用它的一个方法），它就会暂时被装箱为此方法的调用。之后并不改变其值，但意味着失去其曾有的假值特性。根据正在使用的类型，可以把其转换回一个未装箱的值：

    function (rhs) {return !! this.valueOf () !== !! rhs};

>20.!!x是一个惯用法，以确保x最终为为一个布尔值！。这是一个双重否定，!总是返回真(true)或假(false)。

6	出色的相等语句
-----------------------------

JavaScript真正重要的东西并不都是从其使用方式上显而易见。例如：语句`foo.bar`在所有情况下都与`foo['bar']`相同。可以提前安全地对代码进行这种转变，无论是对值属性或其他事物。进一步来说，可以指定非标识符到对象属性：

    var foo = [1, 2, 3];
    foo['@snorkel!'] = 4;
    foo['@snorkel!']    // => 4

当然还可以以这种方式读取属性：

    [1, 2, 3]['length']         // => 3
    [1, 2, 3]['push']           // => [native function]

事实上，这是`for (var ... in ...)`语法的内置行为：枚举对象的属性。因此，例如：

    var properties = [];
    for (var k in document) properties.push (k);
    properties         // => 一堆字符串

然而，`for ... in`也有暗面，当修改原型时会发生一些很奇怪的事。例如：

    Object.prototype.foo = 'bar';
    var properties = [];
    for (var k in {}) properties.push (k);
    properties          // => ['foo']

为了解决此问题，应该做两件事。首先，不去修改Object的原型对象(prototype)，因为一切都是Object的实例（包括数组和所有其他装箱对象）;第二，使用hasOwnProperty[21]：

    Object.prototype.foo = 'bar';
    var properties = [], obj = {};
    for (var k in obj) obj.hasOwnProperty (k) && properties.push (k);
    properties          // => []

而且非常重要的是不要用`for... in`遍历数组对象（它返回字符串索引，不是数字，这可能会导致问题）或字符串。如果你对Array或String（或者Object，但你不应该这样做）添加方法，都会导致失败。

>21.为什么没有看到hasOwnProperty在`for ... in`循环，因为它显然是一个属性。其原因在于JavaScript的属性有是否可见的标志（ECMAScript标准定义），其中之一是`DontEnum`。如果`DontEnum`被设置在某些属性上，然后`for ... in`循环将无法枚举它。JavaScript没有提供一种方法来设置`DontEnum`标志到添加到原型对象的事物上，因此，使用hasOwnProperty是一个很好的方法来防止循环时访问他人的原型对象扩展对象。请注意，在IE6中有时会失败；如果原型对象提供一个名称相同的属性，相信会始终返回false。

7	\ {如果你有20分钟...}
---------------------------------

  Javascript可以做几乎任何其他语言能做到。然而，它可能不是很明显该如何去。

7.1	\第{爽人的迭代}
    因为像Ruby语言向世界展示了如何通过\'E | |循环真的是，很多自我尊重功能的程序员不喜欢用它们。如果你在Firefox中，你
    不会有阵列原型包括|地图|和|的forEach |功能已经。但如果你正在编写跨浏览器的代码，并没有使用一个库，为他们提供
    为你，这里是一个很好的方式来实现：


array.prototype.each = Array.prototype.forEach | |函数（F）{
  （VAR我= 0，L = this.length; <L + + I）
    F（[I]）;
  返回的链接/ /方便
};

array.prototype.map = Array.prototype.map | |函数（F）{
  VAR YS = [];
  （VAR我= 0，L = this.length; <L + + I）
    ys.push（f（本[我]））;
  返回YS;
};


    据我所知，这是（几乎）以最快的方式来写这些功能。我们声明两个变量前（|我|和| L |），这样的长度是缓存; Javascript将不知道
    this.length是不变与| |循环，所以它会检查每一个时间，如果我们不能缓存。这是昂贵的，因为由于拳击，我们就会有一个失败的哈希查找
    |这|，然后下降到this.__proto__ |，会发现它的特殊属性的长度。然后，方法调用会发生检索
    |长度|。\脚注{得到的Javascript如何呈现某些API。它内部有一个gettable和设置属性的概念，虽然没有一个跨浏览器的方法
    创建它们。但属性，如{\ TT长度} {\ TT的ChildNodes}等〜是所有真正的方法调用，而不是实地查找。 （尝试分配到一个，你会看到。）}

    只有进一步优化，可以通过阵列向后（只|每|，因为|地图|假设维持秩序）：


array.prototype.each =功能（F）{
  （I = this.length - 1> = 0; - 我）
    F（[I]）;
};


    这结束是非常略高于第一实现更快，因为它改变了一个浮点减法（需要评估\ | <|为非零数量）成一个符号动词
    检查，它的内部是按位|和|和零谓跳。除非你的JavaScript引擎，内联函数，你真的有决心，有杀手的性能（在
    这点，我会问你为什么摆在首位的Javascript），你可能永远需要考虑的一个非零相对开销| <|和〜零|> = |。

    您还可以定义一个迭代器对象，但不是这个样子：


/ /没有！！不这样做！
object.prototype.each =功能（F）{
  （VAR在此K）this.hasOwnProperty（K）&& F（K）;
};


    更好的是要实现一个单独的|键|功能，以避免污染|对象|原型：


VAR键=功能（O）{
  XS = [];
  （VAR在O K）o.hasOwnProperty（K），&& xs.push（K）;
  返回XS;
};


7.2	\第{Java类和接口}
    任何理智的人任何时候都希望使用这些。但是，如果你是疯了或正在被迫，那么谷歌Web工具包会给你一种方式来拍摄自己的脚，把它变成
    中的JavaScript。

7.3	\第{递归元类}
    有不同的方法来实现这一点，但一个简单的方法是这样做的：\脚注{请记住，一类是只是一个函数，它产生的实例。一无所知
    {\ TT新的关键字是必要的，写面向对象的代码（谢天谢地）。}


元类= {方法：{
  add_to功能：（O）{
    T =;
    键（this.methods）（函数（k）{
      问题o [K] = BIND（t.methods [K]，O）; / /不能使用/ /这里
    }）;
    返回O}};
metaclass.methods.add_to.call（元类，元类）;


    在这一点上，|元类本身现在是|元类。我们就可以开始执行它的实例：


VAR regular_class = metaclass.add_to（{方法：{}}）;
regular_class.methods.def =功能（名称，值）{
  this.methods [名称] =值;
  返回本;
};
regular_class.methods.init =函数（O）{
  实例= O | | {方法：{}};
  this.methods.init && this.methods.init.call（实例）;
  返回this.add_to（实例）;
};
regular_class.add_to（regular_class）;


    这是一个Ruby风格的类，在这里你可以定义公共方法和构造。因此，例如：


点= regular_class.init（）;
point.def（'初始化'，函数（）{this.x = this.y = 0}）;
point.def（“距离”，函数（）{
  返回Math.sqrt（this.x * this.x + this.y * this.y）}）;


    我们使用的是相当冗长| this.x |，这可能会得罪一些Python-避开的Ruby爱好者。幸运的是，我们可以使用动态重写使用| $ |地方Ruby爱好者将使用
    | @ |：{。，事实上，我们可以烤成一个元类，使其完全透明的，如果我们想{\ TT改造红宝石（）}} \脚注


VAR红宝石=功能（F）{
  返回的eval（f.toString（）（/ \ $（\ W +）/克，
    函数（，名称）{返回'。“ +名称}））;
};

point.def（“初始化”，红宝石（函数（）{$ X = $ Y = 0}））;
point.def（“距离”，红宝石（函数（）{
  返回Math.sqrt（$ X * $ x + $ Y * $ Y）}））;


    现在你可以使用这个类：


P = point.init（）;
p.x = 3，p.y = 4;
p.distance（）/ / => 5


    使用元类的优点是，你可以做有趣的东西，它们的结构。例如，假设我们要插入到我们的所有点的调试方法跟踪
    用途：\脚注{这里的例子使用含有{\ TT arguments.join}，表达，这是无效的 - {\ TT参数}是不是一个数组。现在，它使用的``假装这是一个数组
    上调用{\ TT连接}“的成语，通常的目的。 （虽然你有时不是广义方法的错误，是对浏览器的情况下，如果您尝试使用
    {\，TT Array.prototype.toString（）}这种方式。）}


键（point.methods）（函数（k）{
  VAR原point.methods [K];
  point.methods [K] =函数（）{
    跟踪（“调用方法”+ K +'参数'+
           array.prototype.join.call（参数，'，'））;
    返回original.apply（这一点，参数）;
  };
}）;


    |跟踪|（这是不是内置的，所以你必须定义一个Javascript）被称为每次任何方法|点|实例被称为，这将有机会获得
    双方的观点和国家。

7.4	\第{尾调用}
    JavaScript并没有做尾部调用优化默认情况下，这是一种耻辱，因为有些浏览器调用栈短（最短的，我所知道的是500帧，由特别
    很快，当你有绑定功能和迭代）。幸运的是，在Javascript编码尾调用，实际上是非常简单的：


function.prototype.tail =函数（）{[这一点，参数]};
function.prototype.call_with_tco =函数（）{
  VARç= [这一点，参数;
  逃生=参数的arguments.length - 1];
  （C [0] ==逃生）
    C = C [0]申请（本，C [1]）;
  escape.apply返回（这一点，C [1]）;
};


    现在我们可以用这个定义来写尾部调用优化的阶乘函数：\脚注{这种技术被称为{\ EM蹦床}，并不构成实施分隔
    延续，后来我发现。然而，它还是蛮爽的。}


/ /标准的递归定义
fact1 =功能（N）{
  返回N> 0？ N * fact1（N - 1）：1;
};

/ /尾递归定义
fact2 =功能（ACC）{
  返回N> 0？ fact2（N - 1，ACC * N）：ACC;
};

/ /我们的尾部调用机制
fact3 =功能（N，K），ACC {
  返回N> 0？ fact3.tail（N - 1，ACC * N，K）：k.tail（ACC）;
};


    前两个函数通常可以被称为：


fact1（5）/ / => 120
fact2（5，1）/ / => 120


    \ noindent，会，但双方将在不断的堆栈空间运行。第三，另一方面，如果我们把它这种方式：


ID =函数（X）{X};
fact3.call_with_tco（5，1，ID）/ / => 120


    尾部调用优化策略的工作方式，而不是创建新的堆栈帧：


fact1（5）
  5 * fact1（4）
    4 * fact1（3）
    ...


    \ noindent，会甚至创造空心的：


fact2（5，1）
  fact2（4，5）
    fact2（3 20）
    ...


    \ noindent，会弹出最后的堆栈帧分配一个新的（处理阵列之前[功能中，args] |要返回的延续）：


fact3（5，1，K） - > [fact3，[4，5，K]
fact3（4，5，K） - > [fact3，[3，20，K]
fact3（3，20，K）...


    这不是一个糟糕的表现命中， - 两个元素的数组的指针分配的开销是最小的。

7.5	\第{的句法宏和操作符重载}
    懒惰的范围，让我们做一些很酷的东西。比方说，我们要定义一个新的变量声明的语法形式，代替：


VAR =函数（）{
  Y =（（X）返回X + 1}）（5）;
  ...
};


    \ noindent，会我们可以写：


VAR =函数（）{
  Y =（X + 1）（X = 5）;
  ...
};


    这可以在正则表达式实现，如果我们不介意，大约一半的时间远远不正确：


expand_where =功能（F）{
  VAR = f.toString（）;
  返回的eval（s.replace（/ \（（[^）]）\）\（（[^）]）\）/ \。，
    函数（，身体，值）{
      返回'（功能（“+ value.split（'='）[0 +'）{回报'+
             机身+'}）（“+ value.split（'='，2）[1] +”）“;
    }））;
};


    现在，我们可以这样说：


VAR = expand_where（的函数（）{
  Y =（X + 1）（X = 5）;
  ...
}）;


    显然是一个适当的解析器是比较合适的，因为它不会失败简单括号边界的。但重要的是实现一个函数给你一个引用代码的方式，只是
    喜欢在Lisp：


（defmacro美孚（栏）...）
（foo的一些表达）


    \ noindent，会成为在Javascript（假设存在|解析|和| deparse |，这是相当复杂）：\脚注{这些真实的版本中实现的
    \ URL {http://github.com/spencertipping/caterwaul}的，如果你有兴趣，看到他们的样子。这也是合理的句法边缘案件参考。


VAR defmacro =（变换）{
  返回功能（F）{
    返回的EVAL（deparse的（转换（解析（f.toString（）））））;
  };
};
VAR FOO = defmacro（功能（parse_tree）{
  回归......;
}）;
美孚（函数（）{一些表达式}）;


    这个原则可以扩展到允许操作符重载，如果我们写改写成方法调用运营商的转型：


X << Y / /变为x [“<<”]（Y）


    请记住，属性名不限制标识符 - 所以我们可以重载| <<阵列工作，就像它在Ruby中没有与运营商：


array.prototype ['<<'] =函数（）{
  （VAR我= 0，L =的arguments.length; <L + + I）
    this.push（参数[I]）;
  返回本;
};


    这是关于实施这种东西在Javascript中，而比Lisp不幸的是唯一的Javascript烤成语法的语法结构，所以试图引进新的
    句法形式，如| |时，是不是很方便：


expand_when（函数（）{
  当（富）{/ /编译错误; {意外
    酒吧（）;
  }
}）;


    但是，什么可以做，里面的Javascript解析树是公平的游戏。\脚注{记住{\ TT的toString}有时会重写你的函数的标准形式，所以利用
    含糊不清的语法是无益的。例如，在Firefox中，写多余的括号表达式是没有用的，因为这些多余的括号丢失，当你调用{\ TT
    的toString}}

8	\ {进一步阅读}
----------------------------
  我强烈建议阅读（\ URL {http://jquery.com}）jQuery的代码库的质量和自觉性。这是一个辉煌的一块工作，我学到了大量
  通过它刨着左右。

  道格拉斯，克罗克福德已书面包括知名{\它的JavaScript：好的零件}一些优秀的Javascript引用，语言和一个不太知名的，但免费在线旅游
  \网址{http://javascript.crockford.com/survey.html}的\脚注{他JavaScript和矿山之间有一些差异。既不是不正确的，只是不同的不成文
  假设。例如，当他说，有三个原始，他是正确的，他计数装箱交涉，而我算他们的文字数量
  构造。}

  作为一个无耻的插件，我也建议通过三岔口（\ URL {http://github.com/spencertipping/divergence}），我写了一个库，阅读。这是非常不同 - 从jQuery更
  简洁和算法（并没有DOM参与）。 jQuery使用更传统的方法，而分歧往往使倒闭的大量使用和功能的元编程。

  如果你的Lisp和元编程，你也可能享受\ URL {http://github.com/spencertipping/divergence.rebase}和\ URL {http://github.com/spencertipping/caterwaul}的两个项目
  使用功能系列化和的eval（）|实施一些在最后一节中提到的语法扩展。

  另外，我最近发现称为\ URL {http://wtfjs.com}网站，这似乎是致力于揭露所有JavaScript的边缘的情况下病症。这是相当有趣，启发读。更
  深入看看JavaScript的好，坏，丑陋的部分是\网址{http://perfectionkills.com}的;本网站书面的PrototypeJS开发商之一，已经说服了我，我真的
  不知道的Javascript。
\ {文件}

