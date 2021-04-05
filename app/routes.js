/**
 * ==================================================
 *  Main Routes
 * ==================================================
 */
app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
	$locationProvider.html5Mode(true).hashPrefix('!');
	
	$routeProvider
	.when('/', {
		templateUrl: 'templates/home.html',
		controller: 'homeController'
	})
	.when('/login', {
		controller: 'mainController'
	})
	.when('/users', {
		templateUrl: 'templates/user/list.html',
		controller: 'userController'
	})
	.when('/arrears/op-list', {
		templateUrl: 'templates/arrears/op-list.html',
		controller: 'arrearController'
	})
	.when('/arrears/ip-list', {
		templateUrl: 'templates/arrears/ip-list.html',
		controller: 'arrearController'
	})
	.when('/arrears/payment/:type/:an/:hn', {
		templateUrl: 'templates/arrears/payment.html',
		controller: 'arrearController'
	})
	.when('/reports/op-list', {
		templateUrl: 'templates/reports/op-list.html',
		controller: 'arrearController'
	})
	.when('/reports/ip-list', {
		templateUrl: 'templates/reports/ip-list.html',
		controller: 'arrearController'
	})
	// .when('/pharma/ip', {
	// 	templateUrl: 'templates/pharma/ip.html',
	// 	controller: 'pharmaController'
	// })
	// .when('/pharma/new-druglists', {
	// 	templateUrl: 'templates/pharma/drug-list-form.html',
	// 	controller: 'pharmaController'
	// })
	// .when('/pharma/user-druglists', {
	// 	templateUrl: 'templates/pharma/user-drug-list.html',
	// 	controller: 'pharmaController'
	// })
	.otherwise({
		redirectTo: '/'
	});
}]);
