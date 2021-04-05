app.controller('reportController', [
	'$rootScope',
	'$scope',
	'$http',
	'CONFIG',
	'$routeParams',
	'StringFormatService',
	'toaster',
	function($rootScope, $scope, $http, CONFIG, $routeParams, StringFormatService, toaster) 
	{
		$scope.sdate = '';
		$scope.edate = '';

		$scope.data = [];
		$scope.pager = null;
		$scope.errors = null;

		$scope.isOpCase = false;
		$scope.totalData = {};
		$scope.payment = {};

		const initTotalArrear = function() {
			return {
				totalToPay: 0,
				totalPaid: 0,
				totalArrear: 0,
			}
		};
		
		const initTotalPaid = function() {
			return {
				totalPaid: 0
			}
		};
		
		const getDateRange = (startOfToSDate = false, endofToEDate = false) => {
			let startDate = startOfToSDate
								? moment().startOf('month').format('YYYY-MM-DD')
								: moment().format('YYYY-MM-DD');
			let endDate = endofToEDate
								? moment().endOf('month').format('YYYY-MM-DD')
								: moment().format('YYYY-MM-DD');

			return {
				startDate: ($scope.sdate !== '') 
							? StringFormatService.convToDbDate($scope.sdate) 
							: startDate,
				endDate: ($scope.edate !== '')
							? StringFormatService.convToDbDate($scope.edate) 
							: endDate,
			};
		};

		$scope.getOpArrears = function(e) {
			if(e) e.preventDefault();

			$scope.totalData = initTotalArrear();

			let { startDate, endDate } = getDateRange();

			$http.get(`${CONFIG.apiUrl}/arrears-op/${startDate}/${endDate}`)
			.then(res => {
				$scope.data = res.data.ops;

				$scope.data.forEach(async (ip) => {
					let res = await $http.get(`${CONFIG.apiUrl}/arrears-paid/op/${ip.vn}/${ip.hn}`);
					let totalPaid = res.data ? parseFloat(res.data.total_paid) : 0;

					ip.rcpt_money = parseFloat(ip.rcpt_money) + totalPaid;
					ip.remain = parseFloat(ip.paid_money) - ip.rcpt_money;
					
					// Summary total paid and remain
					$scope.totalData.totalPaid += ip.rcpt_money;
					$scope.totalData.totalArrear += ip.remain;
				});
				
				// Summary total to pay
				$scope.totalData.totalToPay = calcArrearTotal($scope.data);
			}, err => {
				console.log(err)
			});
		};

		$scope.getIpArrears = function(e) {
			if(e) e.preventDefault();

			$scope.totalData = initTotalArrear();
			
			let { startDate, endDate } = getDateRange(true);

			$http.get(`${CONFIG.apiUrl}/arrears-ip/${startDate}/${endDate}`)
			.then(res => {
				$scope.data = res.data.ips;

				$scope.data.forEach(async (ip) => {
					let res = await $http.get(`${CONFIG.apiUrl}/arrears-paid/ip/${ip.an}/${ip.hn}`);
					let totalPaid = res.data ? parseFloat(res.data.total_paid) : 0;

					ip.rcpt_money = parseFloat(ip.rcpt_money) + totalPaid;
					ip.remain = parseFloat(ip.paid_money) - ip.rcpt_money;
					
					// Summary total paid and remain
					$scope.totalData.totalPaid += ip.rcpt_money;
					$scope.totalData.totalArrear += ip.remain;
				});
				
				// Summary total to pau
				$scope.totalData.totalToPay = calcArrearTotal($scope.data);
			}, err => {
				console.log(err)
			});
		};

		$scope.getPayment = (e) => {
			const type = $routeParams.type;
			const an = $routeParams.an;
			const hn = $routeParams.hn;

			$scope.totalData = initTotalPaid();

			if (type === 'op') {
				$scope.isOpCase = true;
			} else {				
				$scope.isOpCase = false;
			}

			$http.get(`${CONFIG.apiUrl}/arrears-payment/${type}/${an}/${hn}`)
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
			// let paidTime = $('#txtPaidTime').val();
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
				// paid_time: `${paidTime}:00`,
				paid_amount: paidAmount,
				remain: parseFloat($scope.payment.visit.remain) - parseFloat(paidAmount),
				cashier: $rootScope.loggedInUser,
				remark: remark
			};

			let url = $scope.isOpCase 
						? `${CONFIG.apiUrl}/arrears-payment/${$scope.payment.visit.vn}/${$scope.payment.visit.hn}`
						: `${CONFIG.apiUrl}/arrears-payment/${$scope.payment.visit.an}/${$scope.payment.visit.hn}`;

			$http.post(url, newArrear)
			.then(res => {
				console.log(res);

				if (res.data.status === 1) {
					toaster.pop('success', "", 'บันทึกข้อมูลสำเร็จ !!!');

					// refresh page to update data
					window.location.reload();
				} else {
					$scope.errors = res.data.errors;

					toaster.pop('warning', "", 'คุณกรอกข้อมูลไม่ครบ !!!');
				}
			}, err => {
				console.log(err);

				toaster.pop('error', "", 'เกิดข้อผิดพลาด ไม่สามารถบันทึกข้อมูลได้ !!!');
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