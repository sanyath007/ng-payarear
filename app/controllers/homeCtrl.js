
app.controller('homeController', [
    '$scope',
    '$http',
    'CONFIG',
    'ChartService',
    function($scope, $http, CONFIG, ChartService)
    {
        $scope.cboYear = '';
        $scope.pieOptions = {};
        $scope.barOptions = {};
        $scope.toDay = new Date();
        $scope.cardData = [
            {
                id: 1,
                name: "ผู้ป่วยใหม่",
                value: 150,
                unit: 'คน',
                bg: 'bg-info',
                icon: 'ion-bag',
                lnk: ''
            },
            {
                id: 2,
                name: "ประชากร",
                value: '150,000',
                unit: 'คน',
                bg: 'bg-success',
                icon: 'ion-stats-bars',
                lnk: ''
            },
            {
                id: 3,
                name: "บุคลากร",
                value: 650,
                unit: 'คน',
                bg: 'bg-warning',
                icon: 'ion-person-add',
                lnk: ''
            },
            {
                id: 4,
                name: "แพทย์",
                value: 35,
                unit: 'คน',
                bg: 'bg-danger',
                icon: 'ion-graph',
                lnk: ''
            },
        ];

        $scope.getCardData = function (e) {
            if(e) e.preventDefault();
            
            let year = $scope.cboYear !== '' ? parseInt($scope.cboYear) - 543 : $scope.toDay.getFullYear();

            $scope.loading = true;

            $http.get(`${CONFIG.baseUrl}/dashboard/card-data`)
            .then(function(res) {
                console.log(res);
                $scope.cardData = res.data[0];

                $scope.loading = false;
            }, function(err) {
                console.log(err);
                $scope.loading = false;
            });
        }

        $scope.getOpVisit = function (e) {
            if(e) e.preventDefault();
            
            let year = $scope.cboYear !== '' ? parseInt($scope.cboYear) - 543 : $scope.toDay.getFullYear();

            ChartService.getSeriesData('/op/visit/', year)
            .then(function(res) {
                let visitSeries = [];
                let categories = ChartService.createYearlyCategories();

                res.data.opvisit.forEach((value, key) => {
                    let visit = value.num_pt ? parseInt(value.num_pt) : 0;

                    visitSeries.push(visit);
                });

                $scope.barOptions = ChartService.initBarChart("opVisitBarContainer", "ยอดผู้ป่วยนอกรายเดือน", categories, 'จำนวน');
                $scope.barOptions.series.push({
                    name: 'op visit',
                    data: visitSeries,
                    color: '#e41749',
                });

                let chart = new Highcharts.Chart($scope.barOptions);
            }, function(err) {
                console.log(err);
            });
        };

        $scope.getOpVisitType = function (e) {
            if(e) e.preventDefault();
            
            let year = $scope.cboYear !== '' ? parseInt($scope.cboYear) - 543 : $scope.toDay.getFullYear();

            ChartService.getSeriesData('/op/visit-type/', year)
            .then(function(res) {
                let dataSeries = [];

                $scope.pieOptions = ChartService.initPieChart("opVisitTypePieContainer", "สัดส่วนผู้ป่วยนอก ตามประเภทการมา", "", "สัดส่วนตามประเภทการมา");

                res.data.opVisitType.forEach((value, key) => {
                    $scope.pieOptions.series[0].data.push({name: value.type, y: parseInt(value.num_pt)});
                });

                let chart = new Highcharts.Chart($scope.pieOptions);
            }, function(err) {
                console.log(err);
            });
        };

        $scope.getIpVisit = function(e) {
            if(e) e.preventDefault();
            
            let year = $scope.cboYear !== '' ? parseInt($scope.cboYear) - 543 : $scope.toDay.getFullYear();
            
            ChartService.getSeriesData('/dashboard/ip-visit-year/', year)
            .then(function(res) {
                let visitSeries = [];
                let categories = ChartService.createYearlyCategories();

                res.data.forEach((value, key) => {
                    let visit = value.num_pt ? parseInt(value.num_pt) : 0;

                    visitSeries.push(visit);
                });

                $scope.barOptions = ChartService.initBarChart("ipVisitBarContainer", "ยอดผู้ป่วยในรายเดือน", categories, 'จำนวน');
                $scope.barOptions.series.push({
                    name: 'ip visit',
                    data: visitSeries,
                    color: '#1f640a',
                });

                let chart = new Highcharts.Chart($scope.barOptions);
            }, function(err) {
                console.log(err);
            });
        };
        
        $scope.getIpClass = function (e) {
            if(e) e.preventDefault();
            
            let year = $scope.cboYear !== '' ? parseInt($scope.cboYear) - 543 : $scope.toDay.getFullYear();
            
            ChartService.getSeriesData('/dashboard/ip-class-year/', year)
            .then(function(res) {
                $scope.pieOptions = ChartService.initPieChart("ipClassificationPieContainer", "สัดส่วนผู้ป่วยใน ตามประเภทผู้ป่วย", "", "สัดส่วนตามประเภทผู้ป่วย");

                res.data.forEach((value, key) => {
                    Object.keys(value).forEach(name => {
                        $scope.pieOptions.series[0].data.push({name: name, y: parseInt(value[name])});
                    });
                });

                let chart = new Highcharts.Chart($scope.pieOptions);
            }, function(err) {
                console.log(err);
            });
        };
    }
]);
