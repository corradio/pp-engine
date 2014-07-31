import numpy as np

PARAMS = {
    'p_mon': 1.0, # Minimum number of points exchangeable (if two players at same level compete)
    'p_slope': 1.0, # Extra points exchanged per level difference
    'p_winning_ratio_slope': 0.05, # Extra points given for each percentage of balls won
    'level_delta': 2.0, # Number of points required to reach level 2
    'level_delta_increment': 1.0 # Increment of number of points to next level, added per level
}

def compute_point_exchange(delta_levels, winning_ratio):
    dp = int(
        np.round(
            PARAMS['p_mon'] + PARAMS['p_slope'] * np.abs(delta_levels) + PARAMS['p_winning_ratio_slope'] * winning_ratio * 100.0
        )
    )
    return dp

def compute_level(points):
    c1 = PARAMS['level_delta']
    c2 = PARAMS['level_delta_increment']
    a = 0.5*c2
    b = -0.5*c2 + c1
    c = -points
    det = np.power(b, 2) - 4.0 * a * c
    r = [0.5 * (-b + np.sqrt(det))/a, 0.5 * (-b - np.sqrt(det))/a]
    # r = np.roots(np.array([
    #     0.5 * PARAMS['level_delta_increment'],
    #     -0.5 * PARAMS['level_delta_increment'] + PARAMS['level_delta'],
    #     -points
    # ]))
    return int(np.max(np.floor(r)))

def compute_points_to_next_level(level):
    return PARAMS['level_delta'] * level + (level - 1.0) * level * 0.5 * PARAMS['level_delta_increment']

def plot():
    import matplotlib.pyplot as plt

    # Visualise (and test) point levels
    p = np.linspace(0, 500, num=100)
    plt.plot(p, map(compute_level, list(p)))
    plt.show()
    # l = np.linspace(0, 20, num=20)
    # plt.plot(l, map(compute_points_to_next_level, list(l)))
    # plt.show()

plot()
