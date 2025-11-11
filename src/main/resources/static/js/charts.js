// Получаем canvas
const ctx = document.getElementById("collisionChart").getContext("2d");

// Пустой график для колизии
const collisionChart = new Chart(ctx, {
    type: 'scatter',
    data: {
        datasets: [{
            label: 'Collision: переданная энергия vs коэффициент отражения',
            data: [], // пока пусто
            backgroundColor: 'rgba(75, 192, 192, 0.7)'
        }]
    },
    options: {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: 'График столкновения'
            }
        },
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                title: {
                    display: true,
                    text: 'переданная энергия (Дж)'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'коэффициент отражения'
                }
            }
        }
    }
});

// Функция для обновления графика
function updateCollisionChart(data) {
    collisionChart.data.datasets[0].data = data.map(d => ({
        x: d.transferredEnergy,
        y: d.reflectionCoefficient
    }));
    collisionChart.update();
}

// Экспортируем функцию, чтобы можно было вызвать из potential.js
window.updateCollisionChart = updateCollisionChart;
