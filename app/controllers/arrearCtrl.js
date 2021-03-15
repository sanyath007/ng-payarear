app.controller('arrearController', [
	'$rootScope',
	'$scope',
	'$http',
	'CONFIG',
	'$routeParams',
	'StringFormatService',
	function($rootScope, $scope, $http, CONFIG, $routeParams, StringFormatService) 
	{
		$scope.sdate = '';
		$scope.edate = '';
		$scope.data = [];
		$scope.pager = null;

		$scope.isOpCase = false;
		$scope.totalData = {};
		$scope.payment = {};

		const initTotalArrear = function() {
			return {
				totalArrear: 0
			}
		};
		
		const initTotalPaid = function() {
			return {
				totalPaid: 0
			}
		};

		$scope.getIpArrears = function(e) {
			if(e) e.preventDefault();

			$scope.totalData = initTotalArrear();
			
			let startDate = ($('#sdate').val() !== '') 
							? StringFormatService.convToDbDate($scope.sdate) 
							: moment().startOf('month').format('YYYY-MM-DD');
			let endDate = ($('#edate').val() !== '') 
							? StringFormatService.convToDbDate($scope.edate) 
							: moment().format('YYYY-MM-DD');

			$http.get(`${CONFIG.apiUrl}/arrears-ip/${startDate}/${endDate}`)
			.then(res => {
				$scope.data = res.data.ips;

				// Summary total arrear of ip
				$scope.totalData.totalArrear = calcArrearTotal($scope.data);
			}, err => {
				console.log(err)
			});
		};
		
		$scope.getOpArrears = function(e) {
			if(e) e.preventDefault();

			$scope.totalData = initTotalArrear();

			let startDate = ($('#sdate').val() !== '') 
							? StringFormatService.convToDbDate($scope.sdate) 
							: moment().format('YYYY-MM-DD');
			let endDate = ($('#edate').val() !== '') 
							? StringFormatService.convToDbDate($scope.edate) 
							: moment().format('YYYY-MM-DD');

			$http.get(`${CONFIG.apiUrl}/arrears-op/${startDate}/${endDate}`)
			.then(res => {
				$scope.data = res.data.ops;

				// Summary total arrear of op
				$scope.totalData.totalArrear = calcArrearTotal($scope.data);
			}, err => {
				console.log(err)
			});
		};

		$scope.getPayment = (e) => {
			const type = $routeParams.type;
			const an = $routeParams.an;
			const hn = $routeParams.hn;

			$scope.totalData = initTotalPaid();

			let url = '';			
			if (type === 'op') {
				url = `${CONFIG.apiUrl}/arrears-payment/${type}/${an}/${hn}`;

				$scope.isOpCase = true;
			} else {
				url = `${CONFIG.apiUrl}/arrears-payment/${type}/${an}/${hn}`;
				
				$scope.isOpCase = false;
			}

			$http.get(url)
			.then(res => {
				$scope.payment.visit = res.data.visit;
				$scope.payment.paid = res.data.paid;
				$scope.payment.notes = res.data.notes;
				$scope.payment.items = res.data.items;

				// TODO: คำนวณจำนวนที่ผู้ป่วยชำระแล้ว และกระทบยอดกันระหว่าง payment.visit กับ payment.paid
				$scope.totalData.totalPaid = calcArrearPaidTotal($scope.payment.paid);
				$scope.payment.visit.rcpt_money = parseFloat($scope.payment.visit.rcpt_money) + $scope.totalData.totalPaid;
				$scope.payment.visit.remain = parseFloat($scope.payment.visit.paid_money) - $scope.totalData.totalPaid;
			}, err => {
				console.log(err);
			});
		};

		const calcArrearTotal = (data) => {
			return data.reduce((sum, cur) => sum + parseFloat(cur.income), 0)
		};
		
		const calcArrearPaidTotal = (data) => {
			return data.reduce((sum, cur) => sum + parseFloat(cur.paid_amount), 0)
		};

		$scope.storeArrear = (e) => {
			let paidAmount = $('#txtPaidAmount').val() === '' ? 0 : $('#txtPaidAmount').val();
			let paidDate = $('#txtPaidDate').val();
			let paidTime = $('#txtPaidTime').val();
			let billNo = $('#txtBillNo').val();
			let remark = $('#txtRemark').val();

			// TODO: validate input value before store data

			let newArrear = {
				vn: $scope.isOpCase ? $scope.payment.visit.vn : '',
				an: $scope.isOpCase ? '' : $scope.payment.visit.an,
				hn: $scope.payment.visit.hn,
				paid_no: $scope.payment.paid.length + 1,
				bill_no: billNo,
				paid_date: StringFormatService.convToDbDate(paidDate),
				paid_time: `${paidTime}:00`,
				paid_amount: paidAmount,
				remain: parseFloat($scope.payment.visit.remain) - parseFloat(paidAmount),
				cashier: $rootScope.loggedInUser,
				remark: remark
			};

			console.log(newArrear);
			$http.post(`${CONFIG.apiUrl}/arrears-payment/${$scope.payment.visit.vn}/${$scope.payment.visit.hn}`, newArrear)
			.then(res => {
				console.log(res);
				window.location.reload();
				// TODO: update paid list with new paid

				// TODO: display message popup for successful process
			}, err => {
				console.log(err);

				// TODO: display message popup for failure process
			});
		};

		const calcAge = (birthdate, type) => {
			return moment().diff(moment(birthdate), type);
		};

		$scope.onPaginateLinkClick = (e, link) => {
            e.preventDefault();
            
            $http.get(link)
            .then(res => {
                $scope.data = res.data.items;
                $scope.pager = res.data.pager;

				calculatAge();
            }, err => {
                console.log(err)
            });
        };
	}
]);